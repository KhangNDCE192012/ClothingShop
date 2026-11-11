package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.LoginRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.RegisterRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.AuthResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.repository.RoleRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;
import vn.edu.fpt.sba301_clothing_shop.security.CustomUserDetailsService;
import vn.edu.fpt.sba301_clothing_shop.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Service xử lý xác thực (Authentication), bao gồm đăng nhập (login) và đăng ký tài khoản (register).
 * Tích hợp mã hóa BCrypt và cấp phát JWT token.
 */
@Service
public class AuthenticationService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String ACTIVE_STATUS = "ACTIVE";

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{9,15}$");

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationService(
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * BL-024 & BL-025: Xác thực thông tin đăng nhập và tạo JWT token.
     * Tự động nâng cấp mật khẩu cũ (plain text) sang BCrypt nếu phát hiện.
     *
     * @param request DTO chứa username và password
     * @return AuthResponse chứa JWT access token, thời hạn và thông tin người dùng
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Chuẩn hóa tên đăng nhập bằng cách loại bỏ khoảng trắng thừa hai đầu
        String username = request.username().trim();

        try {
            // 2. Gọi AuthenticationManager để xác thực username và password thông qua Spring Security
            // Quá trình này sẽ gọi CustomUserDetailsService và PasswordEncoder để kiểm tra
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            username,
                            request.password()
                    )
            );
        } catch (DisabledException exception) {
            // 3. Nếu tài khoản có status khác ACTIVE (bị khóa BANNED) -> ném lỗi 401 Unauthorized
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản đã bị khóa"
            );
        } catch (BadCredentialsException exception) {
            // 4. Nếu mật khẩu hoặc username không chính xác -> ném lỗi 401 Unauthorized
            throw invalidCredentials();
        } catch (AuthenticationException exception) {
            // 5. Bắt các ngoại lệ xác thực khác của Spring Security -> ném lỗi 401 Unauthorized
            throw invalidCredentials();
        }

        // 6. Tìm bản ghi người dùng trong cơ sở dữ liệu theo username
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(this::invalidCredentials);

        // 7. BL-027: Nếu mật khẩu trong DB chưa theo định dạng BCrypt ($2...) -> tự động mã hóa lại và lưu
        if (passwordEncoder.upgradeEncoding(user.getPassword())) {
            // Băm mật khẩu người dùng vừa nhập bằng BCrypt
            user.setPassword(passwordEncoder.encode(request.password()));
            // Lưu mật khẩu đã mã hóa mới vào DB
            userRepository.save(user);
        }

        // 8. Nạp thông tin UserDetails của Spring Security
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        // 9. Lấy tên vai trò chuẩn hóa thành chữ hoa (ví dụ: CUSTOMER hoặc ADMIN)
        String role = user.getRole().getName().toUpperCase();
        // 10. BL-025: Tạo JWT access token có chứa username, role và hạn dùng 24h
        String token = jwtService.generateToken(userDetails, role);

        // 11. Trả về AuthResponse chứa token và thông tin người dùng cho frontend
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                role
        );
    }

    /**
     * BL-023: Đăng ký tài khoản khách hàng mới.
     * Validate dữ liệu đầu vào (username 3-50 ký tự, email hợp lệ, password 6-72 byte).
     * Mật khẩu được mã hóa an toàn bằng BCryptPasswordEncoder.
     * Vai trò mặc định luôn là CUSTOMER, trạng thái ACTIVE.
     *
     * @param request DTO chứa thông tin đăng ký
     * @return UserResponse chứa thông tin tài khoản vừa tạo (không bao gồm password)
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        // Kiểm tra đối tượng request không được null
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu đăng ký không được để trống");
        }

        // 1. Validation username: bắt buộc, độ dài từ 3-50 ký tự, chỉ chứa ký tự hợp lệ
        if (request.username() == null || request.username().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username không được để trống");
        }
        String username = request.username().trim();
        if (username.length() < 3 || username.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username phải từ 3 đến 50 ký tự");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang");
        }

        // 2. Validation password: bắt buộc, tối thiểu 6 ký tự, tối đa 72 byte (giới hạn thuật toán BCrypt)
        if (request.password() == null || request.password().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống");
        }
        String password = request.password().trim();
        if (password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự");
        }
        byte[] passwordBytes = password.getBytes(StandardCharsets.UTF_8);
        if (passwordBytes.length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu không được vượt quá 72 byte");
        }

        // 3. Validation email: bắt buộc, tối đa 100 ký tự, phải đúng định dạng email
        if (request.email() == null || request.email().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (email.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được vượt quá 100 ký tự");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không đúng định dạng");
        }

        // 4. Validation fullName (tùy chọn): nếu có thì tối đa 100 ký tự
        String fullName = request.fullName() != null ? request.fullName().trim() : null;
        if (fullName != null && fullName.isEmpty()) {
            fullName = null;
        }
        if (fullName != null && fullName.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được vượt quá 100 ký tự");
        }

        // 5. Validation phone (tùy chọn): nếu có thì phải từ 9 đến 15 số
        String phone = request.phone() != null ? request.phone().trim() : null;
        if (phone != null && phone.isEmpty()) {
            phone = null;
        }
        if (phone != null && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ (9-15 số, có thể bắt đầu bằng +)");
        }

        // 6. Kiểm tra tính duy nhất: không cho phép trùng username hoặc email
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username đã tồn tại");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }

        // 7. Lấy vai trò CUSTOMER từ bảng Roles trong DB
        Role customerRole = roleRepository.findByNameIgnoreCase(CUSTOMER_ROLE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Không tìm thấy vai trò CUSTOMER"
                ));

        // 8. BL-027: Mã hóa mật khẩu an toàn bằng BCryptPasswordEncoder
        String encodedPassword = passwordEncoder.encode(password);

        // 9. Khởi tạo đối tượng User mới và gán toàn bộ thông tin
        User newUser = new User();
        newUser.setUsername(username); // Gán tên đăng nhập
        newUser.setPassword(encodedPassword); // Gán mật khẩu đã mã hóa BCrypt
        newUser.setEmail(email); // Gán email
        newUser.setFullName(fullName); // Gán họ tên
        newUser.setPhone(phone); // Gán số điện thoại
        newUser.setRole(customerRole); // Vai trò luôn là CUSTOMER
        newUser.setStatus(ACTIVE_STATUS); // Trạng thái mặc định là ACTIVE
        newUser.setCreatedAt(LocalDateTime.now()); // Thời gian tạo tài khoản

        try {
            // 10. Lưu đối tượng User mới vào cơ sở dữ liệu
            User savedUser = userRepository.save(newUser);
            // 11. Chuyển đổi sang UserResponse (ẩn trường mật khẩu) và trả về
            return UserResponse.from(savedUser);
        } catch (DataIntegrityViolationException exception) {
            // Bắt lỗi ràng buộc toàn vẹn cơ sở dữ liệu nếu có cạnh tranh đồng thời
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username hoặc email đã tồn tại", exception);
        }
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Sai username hoặc password"
        );
    }
}

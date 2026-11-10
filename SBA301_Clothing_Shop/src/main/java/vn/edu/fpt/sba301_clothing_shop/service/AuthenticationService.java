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
        String username = request.username().trim();

        try {
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            username,
                            request.password()
                    )
            );
        } catch (DisabledException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản đã bị khóa"
            );
        } catch (BadCredentialsException exception) {
            throw invalidCredentials();
        } catch (AuthenticationException exception) {
            throw invalidCredentials();
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(this::invalidCredentials);

        // Nâng cấp mật khẩu sang BCrypt nếu tài khoản vẫn đang dùng mật khẩu cũ (plain text)
        if (passwordEncoder.upgradeEncoding(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.password()));
            userRepository.save(user);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String role = user.getRole().getName().toUpperCase();
        String token = jwtService.generateToken(userDetails, role);

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
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu đăng ký không được để trống");
        }

        // 1. Validation username
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

        // 2. Validation password
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

        // 3. Validation email
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

        // 4. Validation fullName (tùy chọn)
        String fullName = request.fullName() != null ? request.fullName().trim() : null;
        if (fullName != null && fullName.isEmpty()) {
            fullName = null;
        }
        if (fullName != null && fullName.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được vượt quá 100 ký tự");
        }

        // 5. Validation phone (tùy chọn)
        String phone = request.phone() != null ? request.phone().trim() : null;
        if (phone != null && phone.isEmpty()) {
            phone = null;
        }
        if (phone != null && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ (9-15 số, có thể bắt đầu bằng +)");
        }

        // 6. Kiểm tra trùng lặp
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username đã tồn tại");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }

        // 7. Lấy vai trò CUSTOMER từ bảng Roles
        Role customerRole = roleRepository.findByNameIgnoreCase(CUSTOMER_ROLE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Không tìm thấy vai trò CUSTOMER"
                ));

        // 8. Mã hóa mật khẩu và lưu người dùng mới
        String encodedPassword = passwordEncoder.encode(password);

        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(encodedPassword);
        newUser.setEmail(email);
        newUser.setFullName(fullName);
        newUser.setPhone(phone);
        newUser.setRole(customerRole);
        newUser.setStatus(ACTIVE_STATUS);
        newUser.setCreatedAt(LocalDateTime.now());

        try {
            User savedUser = userRepository.save(newUser);
            return UserResponse.from(savedUser);
        } catch (DataIntegrityViolationException exception) {
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

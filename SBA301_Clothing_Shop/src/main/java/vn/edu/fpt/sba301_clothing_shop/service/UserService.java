package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.UserUpdateRequest;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.repository.RoleRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String BLOCKED_STATUS = "BANNED";
    private static final List<String> ALLOWED_STATUSES = List.of("ACTIVE", "INACTIVE", "BANNED");

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{9,15}$");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getCustomers() {
        return userRepository
                .findAllByRoleNameIgnoreCaseOrderByCreatedAtDesc(CUSTOMER_ROLE)
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse lockCustomer(Integer id) {
        User customer = findCustomer(id);
        customer.setStatus(BLOCKED_STATUS);
        return UserResponse.from(userRepository.save(customer));
    }

    @Transactional
    public void deleteCustomer(Integer id) {
        User customer = findCustomer(id);

        if (userRepository.countOrdersByUserId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa khách hàng đã có đơn hàng"
            );
        }

        userRepository.deleteCartsByUserId(id);
        userRepository.delete(customer);
    }

    private User findCustomer(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID phải lớn hơn 0");
        }

        return userRepository.findByIdAndRoleNameIgnoreCase(id, CUSTOMER_ROLE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản customer với ID: " + id
                ));
    }

    public User getInforUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();

        return userRepository.findById(userId).orElse(null);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID phải lớn hơn 0");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng với ID: " + id
                ));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUser(Integer id, UserUpdateRequest request) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID phải lớn hơn 0");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu cập nhật không được để trống");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng với ID: " + id
                ));

        // Cập nhật họ và tên
        if (request.fullName() != null) {
            String fullName = request.fullName().trim();
            if (fullName.length() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được vượt quá 100 ký tự");
            }
            user.setFullName(fullName.isEmpty() ? null : fullName);
        }

        // Cập nhật email
        if (request.email() != null) {
            String email = request.email().trim().toLowerCase(Locale.ROOT);
            if (email.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
            }
            if (email.length() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được vượt quá 100 ký tự");
            }
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không đúng định dạng");
            }
            if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng bởi tài khoản khác");
            }
            user.setEmail(email);
        }

        // Cập nhật số điện thoại
        if (request.phone() != null) {
            String phone = request.phone().trim();
            if (!phone.isEmpty()) {
                if (!PHONE_PATTERN.matcher(phone).matches()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ (9-15 số, có thể bắt đầu bằng +)");
                }
                user.setPhone(phone);
            } else {
                user.setPhone(null);
            }
        }

        // Cập nhật trạng thái
        if (request.status() != null && !request.status().trim().isEmpty()) {
            String status = request.status().trim().toUpperCase(Locale.ROOT);
            if (!ALLOWED_STATUSES.contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ. Phải là ACTIVE, INACTIVE hoặc BANNED");
            }
            user.setStatus(status);
        }

        // Cập nhật vai trò
        if (request.role() != null && !request.role().trim().isEmpty()) {
            String roleName = request.role().trim();
            Role role = roleRepository.findByNameIgnoreCase(roleName)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Vai trò không tồn tại: " + roleName
                    ));
            user.setRole(role);
        }

        try {
            User saved = userRepository.save(user);
            return UserResponse.from(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng bởi tài khoản khác", exception);
        }
    }
}

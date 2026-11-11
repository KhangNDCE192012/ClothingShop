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

/**
 * Service xử lý các nghiệp vụ Quản lý người dùng (User Management).
 * Bao gồm các chức năng: xem danh sách, khóa, xóa và cập nhật thông tin tài khoản.
 */
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

    /**
     * BL-031: Lấy danh sách toàn bộ khách hàng có vai trò CUSTOMER, sắp xếp giảm dần theo ngày tạo.
     * Chuyển đổi Entity sang UserResponse để ẩn hoàn toàn trường mật khẩu.
     *
     * @return Danh sách UserResponse của tất cả khách hàng
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getCustomers() {
        // 1. Truy vấn Database lấy toàn bộ User có Role là CUSTOMER, sắp xếp giảm dần theo ngày tạo (mới nhất lên đầu)
        // 2. Chuyển đổi (map) từng Entity User sang DTO UserResponse để ẩn trường password
        // 3. Thu thập thành danh sách List<UserResponse> và trả về
        return userRepository
                .findAllByRoleNameIgnoreCaseOrderByCreatedAtDesc(CUSTOMER_ROLE)
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    /**
     * BL-032: Khóa một tài khoản khách hàng bằng cách chuyển status thành BANNED.
     *
     * @param id Mã định danh của khách hàng cần khóa
     * @return UserResponse chứa trạng thái mới đã khóa
     */
    @Transactional
    public UserResponse lockCustomer(Integer id) {
        // 1. Tìm tài khoản khách hàng theo ID (kiểm tra tồn tại và role là CUSTOMER)
        User customer = findCustomer(id);
        // 2. Cập nhật thuộc tính status của Entity thành BANNED
        customer.setStatus(BLOCKED_STATUS);
        // 3. Lưu bản ghi đã cập nhật vào Database và chuyển đổi sang DTO trả về
        return UserResponse.from(userRepository.save(customer));
    }

    /**
     * BL-033: Xóa vĩnh viễn tài khoản khách hàng.
     * Ràng buộc: Không được xóa khách hàng nếu đã phát sinh đơn hàng (Orders).
     * Tự động dọn dẹp các giỏ hàng (Carts) liên quan trước khi xóa tài khoản.
     *
     * @param id Mã định danh của khách hàng cần xóa
     */
    @Transactional
    public void deleteCustomer(Integer id) {
        // 1. Tìm kiếm khách hàng theo ID
        User customer = findCustomer(id);

        // 2. Kiểm tra ràng buộc nghiệp vụ: nếu khách hàng đã có đơn hàng thì không được xóa (ném lỗi 409 Conflict)
        if (userRepository.countOrdersByUserId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa khách hàng đã có đơn hàng"
            );
        }

        // 3. Xóa các mục giỏ hàng liên kết với user trong bảng Carts trước
        userRepository.deleteCartsByUserId(id);
        // 4. Xóa bản ghi người dùng khỏi bảng Users
        userRepository.delete(customer);
    }

    /**
     * Hàm helper tìm tài khoản theo ID và xác nhận tài khoản đó có role là CUSTOMER.
     *
     * @param id Mã định danh tài khoản
     * @return Entity User của khách hàng nếu tìm thấy
     */
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

    /**
     * Lấy thông tin entity User theo username phục vụ endpoint /api/users/me.
     *
     * @param username Tên đăng nhập của người dùng
     * @return Entity User
     */
    public User getInforUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();

        return userRepository.findById(userId).orElse(null);
    }

    /**
     * BL-034: Lấy thông tin chi tiết một tài khoản người dùng theo ID.
     *
     * @param id Mã định danh của người dùng
     * @return UserResponse chứa thông tin người dùng
     */
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

    /**
     * BL-034: Cập nhật thông tin tài khoản người dùng (Admin).
     * Kiểm tra validation các trường: họ tên, email (định dạng, trùng lặp), số điện thoại, trạng thái và vai trò.
     *
     * @param id Mã định danh của người dùng cần cập nhật
     * @param request DTO chứa các thông tin chỉnh sửa
     * @return UserResponse chứa thông tin sau khi lưu
     */
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

        // Cập nhật họ và tên (tối đa 100 ký tự)
        if (request.fullName() != null) {
            String fullName = request.fullName().trim();
            if (fullName.length() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được vượt quá 100 ký tự");
            }
            user.setFullName(fullName.isEmpty() ? null : fullName);
        }

        // Cập nhật email (bắt buộc định dạng hợp lệ, không vượt quá 100 ký tự, không trùng với user khác)
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

        // Cập nhật số điện thoại (tùy chọn: 9-15 chữ số, có thể bắt đầu bằng dấu +)
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

        // Cập nhật trạng thái (chỉ nhận ACTIVE, INACTIVE hoặc BANNED)
        if (request.status() != null && !request.status().trim().isEmpty()) {
            String status = request.status().trim().toUpperCase(Locale.ROOT);
            if (!ALLOWED_STATUSES.contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ. Phải là ACTIVE, INACTIVE hoặc BANNED");
            }
            user.setStatus(status);
        }

        // Cập nhật vai trò (tìm theo tên Role trong bảng Roles: CUSTOMER, STAFF, ADMIN)
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

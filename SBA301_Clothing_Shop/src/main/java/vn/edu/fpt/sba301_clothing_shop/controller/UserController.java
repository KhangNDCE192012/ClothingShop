package vn.edu.fpt.sba301_clothing_shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.sba301_clothing_shop.dto.request.UserUpdateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.service.UserService;

import java.util.List;
import java.util.Map;

/**
 * Controller phụ trách các API Quản lý người dùng (User Management).
 * Endpoint gốc: /api/users
 * Bảo mật: Toàn bộ /api/users/** yêu cầu quyền ADMIN (ngoại trừ /api/users/me yêu cầu authenticated).
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * BL-031: Lấy danh sách toàn bộ tài khoản khách hàng (Customer).
     * Phương thức: GET /api/users
     * Quyền hạn: ADMIN
     *
     * @return Danh sách UserResponse (đã ẩn thông tin nhạy cảm như password)
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getCustomers() {
        return ResponseEntity.ok(userService.getCustomers());
    }

    /**
     * BL-034: Lấy chi tiết thông tin một người dùng theo ID.
     * Phương thức: GET /api/users/{id}
     * Quyền hạn: ADMIN
     *
     * @param id Mã định danh của người dùng cần xem
     * @return UserResponse chứa thông tin chi tiết người dùng
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * BL-034: Cập nhật thông tin tài khoản người dùng (họ tên, email, phone, status, role).
     * Phương thức: PUT /api/users/{id}
     * Quyền hạn: ADMIN
     *
     * @param id Mã định danh của người dùng cần cập nhật
     * @param request DTO chứa các thông tin cần thay đổi
     * @return UserResponse sau khi cập nhật thành công
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer id,
            @RequestBody UserUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /**
     * BL-032: Khóa tài khoản khách hàng (chuyển trạng thái sang BANNED).
     * Phương thức: PATCH /api/users/{id}/lock
     * Quyền hạn: ADMIN
     *
     * @param id Mã định danh của Customer cần khóa
     * @return UserResponse chứa trạng thái mới (status: BANNED)
     */
    @PatchMapping("/{id}/lock")
    public ResponseEntity<UserResponse> lockCustomer(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.lockCustomer(id));
    }

    /**
     * BL-033: Xóa tài khoản khách hàng.
     * Phương thức: DELETE /api/users/{id}
     * Quyền hạn: ADMIN
     * Điều kiện: Chỉ xóa được nếu khách hàng chưa có đơn hàng nào trong hệ thống.
     *
     * @param id Mã định danh của Customer cần xóa
     * @return HTTP 204 No Content khi xóa thành công
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Integer id) {
        userService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy thông tin tài khoản của người dùng đang đăng nhập hiện tại từ JWT authentication token.
     * Phương thức: GET /api/users/me
     * Quyền hạn: Authenticated (bất kỳ người dùng nào đã đăng nhập)
     *
     * @param authentication Đối tượng xác thực chứa thông tin username hiện tại
     * @return Đối tượng User đang đăng nhập
     */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(
            Authentication authentication) {

        String username = authentication.getName();
        return ResponseEntity.ok(
                userService.getInforUser(username)
        );
    }
}

package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.sba301_clothing_shop.dto.request.LoginRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.RegisterRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.AuthResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.service.AuthenticationService;
import org.springframework.http.HttpStatus;

/**
 * Controller xử lý các API Xác thực người dùng (Authentication).
 * Endpoint gốc: /api/auth
 * Quyền hạn: Công khai (PermitAll).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    /**
     * BL-024 & BL-025: Đăng nhập hệ thống bằng username/email và mật khẩu.
     * Phương thức: POST /api/auth/login
     * Trả về JWT token (Bearer) kèm thông tin tài khoản sau khi xác thực thành công.
     *
     * @param request DTO chứa username và password
     * @return AuthResponse chứa accessToken, tokenType và thông tin người dùng
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    /**
     * BL-023: Đăng ký tài khoản khách hàng mới (CUSTOMER).
     * Phương thức: POST /api/auth/register
     * Mật khẩu được mã hóa BCrypt, role mặc định luôn là CUSTOMER, status mặc định ACTIVE.
     *
     * @param request DTO chứa username, password, email, fullName (tùy chọn), phone (tùy chọn)
     * @return HTTP 201 Created cùng UserResponse của tài khoản vừa tạo (không chứa password)
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody(required = false) RegisterRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authenticationService.register(request));
    }
}

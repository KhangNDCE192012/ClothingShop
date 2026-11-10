package vn.edu.fpt.sba301_clothing_shop.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO yêu cầu đăng ký tài khoản khách hàng mới (BL-023).
 * Bỏ qua mọi thuộc tính bổ sung như role, status, id nếu client cố tình gửi kèm.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RegisterRequest(
        String username,
        String password,
        String email,
        String fullName,
        String phone
) {
}

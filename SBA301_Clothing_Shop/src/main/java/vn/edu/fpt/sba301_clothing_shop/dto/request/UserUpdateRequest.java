package vn.edu.fpt.sba301_clothing_shop.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO yêu cầu Admin cập nhật thông tin tài khoản người dùng (BL-034).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserUpdateRequest(
        String fullName,
        String email,
        String phone,
        String status,
        String role
) {
}


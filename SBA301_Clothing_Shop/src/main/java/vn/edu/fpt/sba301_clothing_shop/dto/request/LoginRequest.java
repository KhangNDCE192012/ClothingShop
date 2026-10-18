package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Username không được để trống")
        @Size(max = 50, message = "Username không được vượt quá 50 ký tự")
        String username,

        @NotBlank(message = "Password không được để trống")
        @Size(max = 255, message = "Password không hợp lệ")
        String password
) {
}

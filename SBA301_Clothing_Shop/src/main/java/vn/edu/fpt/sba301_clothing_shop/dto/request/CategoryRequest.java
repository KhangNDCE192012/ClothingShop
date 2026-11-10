package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Nguyen Duy Khang
 * DTO kiểm tra tên danh mục khi ADMIN tạo hoặc cập nhật Category BL-012.
 */
public record CategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục không được vượt quá 100 ký tự")
        String name
) {
}

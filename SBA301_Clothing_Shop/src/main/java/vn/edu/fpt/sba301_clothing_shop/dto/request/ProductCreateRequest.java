package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * DTO nhận và kiểm tra dữ liệu ADMIN gửi lên khi tạo sản phẩm BL-007.
 */
public record ProductCreateRequest(
        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 150, message = "Tên sản phẩm không được vượt quá 150 ký tự")
        String name,

        @NotNull(message = "Danh mục không được để trống")
        @Positive(message = "Category ID phải lớn hơn 0")
        Integer categoryId,

        @Pattern(
                regexp = "^(ACTIVE|INACTIVE)$",
                flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Trạng thái sản phẩm phải là ACTIVE hoặc INACTIVE"
        )
        String status
) {
}

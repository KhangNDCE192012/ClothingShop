package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Nguyen Duy Khang
 * Kiểm tra biến thể khi tạo BL-007 hoặc cập nhật BL-008; ID chỉ dùng lúc sửa.
 */
public record VariantCreateRequest(
        @Positive Integer id,
        @NotBlank @Size(max = 50) String size,
        @NotBlank @Size(max = 50) String color,
        @NotBlank @Size(max = 1000) String image,
        @NotNull @PositiveOrZero Integer quantity,
        @NotNull @DecimalMin("0.01") BigDecimal price
) {
    public VariantCreateRequest(String size, String color, String image,
                                Integer quantity, BigDecimal price) {
        this(null, size, color, image, quantity, price);
    }
}

package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * Nguyen Duy Khang
 * Kiểm tra một biến thể được nhập cùng Product mới trong BL-007.
 */
public record VariantCreateRequest(
        @NotBlank @Size(max = 50) String size,
        @NotBlank @Size(max = 50) String color,
        @NotBlank @Size(max = 1000) String image,
        @NotNull @PositiveOrZero Integer quantity,
        @NotNull @DecimalMin("0.01") BigDecimal price
) {
}

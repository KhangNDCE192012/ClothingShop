package vn.edu.fpt.sba301_clothing_shop.dto.response;

import java.math.BigDecimal;

public record VariantResponse(
        Integer id,
        String size,
        String color,
        String image,
        Integer quantity,
        BigDecimal price
) {
    public static VariantResponse from(Integer id, String size, String color, String image, Integer quantity, BigDecimal price) {
        return new VariantResponse(id, size, color, image, quantity, price);
    }
}

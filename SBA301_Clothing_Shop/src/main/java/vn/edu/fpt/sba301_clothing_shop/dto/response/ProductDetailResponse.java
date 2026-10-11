package vn.edu.fpt.sba301_clothing_shop.dto.response;

import vn.edu.fpt.sba301_clothing_shop.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDetailResponse(
        Integer id,
        String name,
        BigDecimal price,
        String image,
        String size,
        String color,
        Integer quantity,
        Integer categoryId,
        String categoryName,
        String status,
        LocalDateTime createdAt
) {
    public static ProductDetailResponse from(Product product) {
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getImage(),
                product.getSize(),
                product.getColor(),
                product.getQuantity(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getStatus(),
                product.getCreatedAt()
        );
    }
}
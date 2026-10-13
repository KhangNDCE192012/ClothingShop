package vn.edu.fpt.sba301_clothing_shop.dto.response;

import vn.edu.fpt.sba301_clothing_shop.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductDetailResponse(
        Integer id,
        String name,
        Integer productId,
        String categoryName,
        String status,
        LocalDateTime createdAt
) {
    public static ProductDetailResponse from(Product product) {
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getStatus(),
                product.getCreatedAt()
        );
    }
}
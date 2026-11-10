package vn.edu.fpt.sba301_clothing_shop.dto.response;

import vn.edu.fpt.sba301_clothing_shop.entity.Product;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về đầy đủ thông tin một sản phẩm và các biến thể cho BL-011.
 */
public record ProductDetailResponse(
        Integer id,
        String name,
        Integer categoryId,
        String categoryName,
        String status,
        LocalDateTime createdAt,
        List<VariantResponse> variants
) {
    /** Chuyển entity và danh sách variant thành response an toàn cho API. */
    public static ProductDetailResponse from(
            Product product,
            List<VariantResponse> variants
    ) {
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getStatus(),
                product.getCreatedAt(),
                variants
        );
    }
}

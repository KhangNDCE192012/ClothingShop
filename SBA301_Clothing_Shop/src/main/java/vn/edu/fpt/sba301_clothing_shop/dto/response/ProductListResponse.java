package vn.edu.fpt.sba301_clothing_shop.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Nguyen Duy Khang
 * DTO dùng chung cho danh sách quản lý BL-006 và sản phẩm nổi bật BL-003.
 */
public record ProductListResponse(
        Integer id,
        String name,
        Integer categoryId,
        String categoryName,
        String status,
        LocalDateTime createdAt,
        String image,
        BigDecimal minPrice
) {
}

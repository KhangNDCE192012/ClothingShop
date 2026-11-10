package vn.edu.fpt.sba301_clothing_shop.dto.response;

import java.math.BigDecimal;

/**
 * DTO trả thông tin Category cho Home và khu vực quản lý BL-012.
 */
public record CategoryResponse(
        Integer id,
        String name,
        String image,
        BigDecimal minPrice
) {
    /** Tạo response quản lý khi Category chưa cần dữ liệu ảnh và giá đại diện. */
    public static CategoryResponse fromBasic(Integer id, String name) {
        return new CategoryResponse(id, name, null, null);
    }
}

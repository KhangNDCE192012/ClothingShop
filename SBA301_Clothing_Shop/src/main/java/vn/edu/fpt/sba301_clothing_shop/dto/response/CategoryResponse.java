package vn.edu.fpt.sba301_clothing_shop.dto.response;

import java.math.BigDecimal;

public record CategoryResponse(
        Integer id,
        String name,
        String image,
        BigDecimal minPrice
) {
}
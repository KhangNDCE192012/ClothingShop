package vn.edu.fpt.sba301_clothing_shop.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CheckoutResponse(
        Integer orderId,
        String status,
        String paymentMethod,
        BigDecimal totalPrice,
        BigDecimal shippingFee,
        LocalDateTime orderDate,
        String message
) {
}
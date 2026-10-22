
package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OrderStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(
            regexp = "PENDING|CONFIRMED|SHIPPING|COMPLETED|CANCELLED|DELETE",
            message = "Trạng thái đơn hàng không hợp lệ"
    )
    private String status;

    public OrderStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}


package vn.edu.fpt.sba301_clothing_shop.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // User đặt hàng
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Thời điểm tạo đơn hàng
    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    // Tổng tiền bao gồm phí vận chuyển
    @Column(name = "total_price", nullable = false,
            precision = 18, scale = 2)
    private BigDecimal totalPrice;

    // Trạng thái đơn hàng
    @Column(name = "status", nullable = false, length = 30)
    private String status;

    // Thông tin người nhận tại thời điểm đặt hàng
    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", length = 20)
    private String recipientPhone;

    @Column(name = "recipient_email", length = 255)
    private String recipientEmail;

    // Địa chỉ giao hàng
    @Column(name = "shipping_address", length = 500)
    private String shippingAddress;

    // Phí vận chuyển
    @Column(name = "shipping_fee", nullable = false,
            precision = 18, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    // Chỉ hỗ trợ COD
    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod = "COD";

    // Ghi chú đơn hàng
    @Column(name = "note", length = 500)
    private String note;

    public Order() {
    }

    @PrePersist
    protected void onCreate() {
        if (orderDate == null) {
            orderDate = LocalDateTime.now();
        }

        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }

        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "COD";
        }

        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}

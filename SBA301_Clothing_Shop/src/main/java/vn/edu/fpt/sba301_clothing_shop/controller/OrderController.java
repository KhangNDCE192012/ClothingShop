package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CheckoutRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.OrderStatusRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CheckoutResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Order;
import vn.edu.fpt.sba301_clothing_shop.entity.OrderDetail;
import vn.edu.fpt.sba301_clothing_shop.service.OrderService;

import java.util.List;

/**
 * Controller xử lý đặt hàng và quản lý đơn hàng (Order Management).
 * Endpoint gốc: /api/orders
 * Bảo mật: Checkout yêu cầu Authenticated; các API /manage/** yêu cầu quyền ADMIN (BL-030).
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * BL-017: Tiến hành đặt hàng thanh toán khi nhận hàng (COD).
     * Phương thức: POST /api/orders/checkout
     * Quyền hạn: Authenticated
     *
     * @param authentication Thông tin người dùng đăng nhập hiện tại
     * @param request DTO chứa địa chỉ giao hàng, phương thức thanh toán và danh sách sản phẩm
     * @return CheckoutResponse chứa thông tin đơn hàng vừa tạo
     */
    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request) {

        // 1. Trích xuất username của người dùng đang đăng nhập từ đối tượng Authentication
        String username = authentication.getName();
        // 2. Kiểm tra nếu không xác định được danh tính người dùng
        if (username == null) {
            throw new IllegalStateException(
                    "Không xác định được người dùng đăng nhập.");
        }

        // 3. Gọi OrderService xử lý tạo đơn hàng, trừ tồn kho và dọn giỏ hàng
        return orderService.checkout(username, request) ;
    }

    /**
     * BL-019: Quản trị viên xem danh sách toàn bộ đơn hàng trong hệ thống (loại trừ đơn DELETED).
     * Phương thức: GET /api/orders/manage
     * Quyền hạn: ADMIN (BL-030)
     *
     * @return Danh sách đơn hàng List<Order>
     */
    @GetMapping("/manage")
    public ResponseEntity<List<Order>> getAllOrder(){
        // 1. Gọi Service lấy danh sách đơn hàng và trả về mã HTTP 200 OK
        return ResponseEntity.ok(orderService.getAllOrder());
    }

    /**
     * BL-020: Quản trị viên xem chi tiết các sản phẩm trong một đơn hàng theo ID.
     * Phương thức: GET /api/orders/manage/{id}
     * Quyền hạn: ADMIN (BL-030)
     *
     * @param id Mã định danh đơn hàng
     * @return Danh sách chi tiết đơn hàng List<OrderDetail>
     */
    @GetMapping("/manage/{id}")
    public ResponseEntity<List<OrderDetail>> getAllOrder(@PathVariable Integer id){
        // 1. Gọi Service lấy chi tiết các dòng đơn hàng theo ID và trả về HTTP 200 OK
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * BL-021: Quản trị viên cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPING, COMPLETED, CANCELLED, DELETED).
     * Phương thức: PUT /api/orders/manage/{id}
     * Quyền hạn: ADMIN (BL-030)
     *
     * @param id Mã định danh đơn hàng
     * @param orderStatusRequest DTO chứa trạng thái mới
     * @return Đơn hàng Order sau khi cập nhật
     */
    @PutMapping("/manage/{id}")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Integer id,
            @Valid @RequestBody OrderStatusRequest orderStatusRequest) {
        // 1. Gọi Service cập nhật trạng thái đơn hàng và trả về đối tượng Order mới
        return ResponseEntity.ok(orderService.updateOrderStatus(id, orderStatusRequest));
    }

}

package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CheckoutRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.OrderStatusRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CheckoutResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Order;
import vn.edu.fpt.sba301_clothing_shop.entity.OrderDetail;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest request) {

        String username = authentication.getName();
        if (username == null) {
            throw new IllegalStateException(
                    "Không xác định được người dùng đăng nhập.");
        }

        return orderService.checkout(username, request) ;
    }

    @GetMapping("/manage")
    public ResponseEntity<List<Order>> getAllOrder(){
        return ResponseEntity.ok(orderService.getAllOrder());
    }
    @GetMapping("/manage/{id}")
    public ResponseEntity<List<OrderDetail>> getAllOrder(@PathVariable Integer id){
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/manage/{id}")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Integer id,
            @Valid @RequestBody OrderStatusRequest orderStatusRequest) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, orderStatusRequest));
    }

}

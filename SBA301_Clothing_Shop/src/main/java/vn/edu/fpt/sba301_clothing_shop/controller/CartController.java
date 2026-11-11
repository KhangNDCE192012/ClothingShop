package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CartRequest;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.service.CartService;

import java.util.List;

/**
 * Controller quản lý giỏ hàng của người dùng (Cart Management).
 * Endpoint gốc: /api/carts
 * Quyền hạn: Bắt buộc đăng nhập (Authenticated).
 */
@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * BL-014: Lấy danh sách sản phẩm trong giỏ hàng của tài khoản đang đăng nhập.
     * Phương thức: GET /api/carts
     *
     * @param authentication Thông tin xác thực người dùng hiện tại
     * @return Danh sách mục giỏ hàng (List<Cart>)
     */
    @GetMapping
    public ResponseEntity<List<Cart>> getMyCart(
            Authentication authentication
    ){
        String username = authentication.getName();
        return ResponseEntity.ok(
                cartService.getMyCart(username)
        );
    }

    /**
     * BL-015: Thêm biến thể sản phẩm vào giỏ hàng.
     * Phương thức: POST /api/carts
     *
     * @param authentication Thông tin xác thực người dùng
     * @param request DTO chứa variantId và số lượng cần thêm
     * @return Đối tượng Cart sau khi lưu
     */
    @PostMapping
    public ResponseEntity<Cart> addToCart(
            Authentication authentication,
            @Valid @RequestBody CartRequest request
    ) {
        String username = authentication.getName();

        return ResponseEntity.ok(
                cartService.addToCart(username, request)
        );
    }

    /**
     * BL-016: Thay đổi số lượng của sản phẩm trong giỏ hàng.
     * Phương thức: PUT /api/carts
     *
     * @param authentication Thông tin xác thực người dùng
     * @param request DTO chứa variantId và số lượng mới
     * @return Đối tượng Cart sau khi cập nhật
     */
    @PutMapping
    public ResponseEntity<Cart> changeQuantity(
            Authentication authentication,
            @Valid @RequestBody CartRequest request
    ) {
        String username = authentication.getName();

        return ResponseEntity.ok(
                cartService.updateQuantityChange(username, request)
        );
    }

}

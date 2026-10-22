package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CartRequest;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.service.CartService;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<List<Cart>> getMyCart(
            Authentication authentication
    ){
        String username = authentication.getName();
        return ResponseEntity.ok(
                cartService.getMyCart(username)
        );
    }

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

package vn.edu.fpt.sba301_clothing_shop.service;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CartRequest;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.entity.Variant;
import vn.edu.fpt.sba301_clothing_shop.repository.CartRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import java.util.List;

@Service
public class CartService {
    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VariantRepository variantRepository;

    public Cart addToCart(String username, @Valid CartRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();

        Variant variant = variantRepository.findById(request.variantId()).orElseThrow(
                () -> new RuntimeException("Không tìm thấy biến thể sản phẩm")
        );

        Cart cart = cartRepository
                .findByUser_IdAndVariant_Id(user.getId(), variant.getId())
                .orElse(null);

        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart.setVariant(variant);
            cart.setQuantity(request.quantity());
        } else {
            int currentQuantity = cart.getQuantity() == null
                    ? 0
                    : cart.getQuantity();

            cart.setQuantity(currentQuantity + request.quantity());
        }


        return cartRepository.save(cart);
    }


    public List<Cart> getMyCart(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();

        return cartRepository.findAllByUser_Id(userId);
    }
}

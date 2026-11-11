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

/**
 * Service xử lý các nghiệp vụ giỏ hàng (Cart Service).
 * Bao gồm: thêm vào giỏ, xem giỏ hàng và cập nhật số lượng sản phẩm.
 */
@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VariantRepository variantRepository;

    /**
     * BL-015: Thêm sản phẩm biến thể vào giỏ hàng của người dùng.
     * Nếu sản phẩm đã có trong giỏ thì cộng dồn số lượng.
     *
     * @param username Tên đăng nhập của người dùng
     * @param request DTO chứa variantId và số lượng
     * @return Cart Entity sau khi lưu
     */
    public Cart addToCart(String username, @Valid CartRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

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

    /**
     * BL-014: Lấy danh sách toàn bộ sản phẩm trong giỏ hàng của người dùng hiện tại.
     *
     * @param username Tên đăng nhập của người dùng
     * @return Danh sách các mục trong giỏ hàng List<Cart>
     */
    public List<Cart> getMyCart(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();

        return cartRepository.findAllByUser_Id(userId);
    }

    /**
     * BL-016: Cập nhật lại chính xác số lượng của sản phẩm biến thể trong giỏ hàng.
     *
     * @param username Tên đăng nhập của người dùng
     * @param request DTO chứa variantId và số lượng mới
     * @return Cart Entity sau khi cập nhật
     */
    public Cart updateQuantityChange(String username, @Valid CartRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

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
            cart.setQuantity(request.quantity());
        }

        return cartRepository.save(cart);
    }
}

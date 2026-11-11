package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.entity.CartId;

import java.util.List;
import java.util.Optional;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Repository truy xuất dữ liệu giỏ hàng (bảng Carts).
 */
public interface CartRepository extends JpaRepository<Cart, CartId> {

    /**
     * Tìm các mục giỏ hàng chứa biến thể của sản phẩm cần xóa (BL-009).
     */
    List<Cart> findAllByVariant_Product_Id(Integer productId);

    /**
     * Tìm mục giỏ hàng theo userId và variantId.
     */
    Optional<Cart> findByUser_IdAndVariant_Id(
            Integer userId,
            Integer variantId
    );

    /**
     * Lấy toàn bộ mục giỏ hàng của một người dùng theo userId (BL-014).
     */
    List<Cart> findAllByUser_Id(Integer userId);

    /**
     * BL-017: Xóa các sản phẩm trong giỏ hàng sau khi người dùng đặt hàng thành công.
     */
    @Modifying
    @Query("""
        DELETE FROM Cart c
        WHERE c.user.id = :userId
          AND c.variant.id IN :variantIds
    """)
    int deleteOrderedItems(
            @Param("userId") Integer userId,
            @Param("variantIds") List<Integer> variantIds
    );
}

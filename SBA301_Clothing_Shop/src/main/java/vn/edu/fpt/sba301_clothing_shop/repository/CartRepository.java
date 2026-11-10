package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.entity.CartId;
import vn.edu.fpt.sba301_clothing_shop.entity.User;

import java.util.List;
import java.util.Optional;

/**
 * Nguyen Duy Khang
 * Truy cập mục giỏ hàng, gồm mục liên quan sản phẩm cần xóa.
 */
public interface CartRepository
        extends JpaRepository<Cart, CartId> {

    /** Tìm mục giỏ hàng chứa biến thể của sản phẩm cần xóa. */
    List<Cart> findAllByVariant_Product_Id(Integer productId);

    Optional<Cart> findByUser_IdAndVariant_Id(
            Integer userId,
            Integer variantId
    );


    List<Cart> findAllByUser_Id(Integer userId);

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

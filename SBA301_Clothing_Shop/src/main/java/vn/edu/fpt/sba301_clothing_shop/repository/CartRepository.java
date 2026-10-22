package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.sba301_clothing_shop.entity.Cart;
import vn.edu.fpt.sba301_clothing_shop.entity.CartId;
import vn.edu.fpt.sba301_clothing_shop.entity.User;

import java.util.List;
import java.util.Optional;

public interface CartRepository
        extends JpaRepository<Cart, CartId> {

    Optional<Cart> findByUser_IdAndVariant_Id(
            Integer userId,
            Integer variantId
    );


    List<Cart> findAllByUser_Id(Integer userId);
}
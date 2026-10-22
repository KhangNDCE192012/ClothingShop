package vn.edu.fpt.sba301_clothing_shop.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.Order;

@Repository
public interface OrderRepository
        extends JpaRepository<Order, Integer> {
}
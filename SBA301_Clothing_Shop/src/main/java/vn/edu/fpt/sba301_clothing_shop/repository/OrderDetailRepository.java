package vn.edu.fpt.sba301_clothing_shop.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.OrderDetail;

@Repository
public interface OrderDetailRepository
        extends JpaRepository<OrderDetail, Integer> {
}
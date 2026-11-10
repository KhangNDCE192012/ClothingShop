package vn.edu.fpt.sba301_clothing_shop.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.Order;
import vn.edu.fpt.sba301_clothing_shop.entity.OrderDetail;

import java.util.List;

/**
 * Nguyen Duy Khang
 * Truy cập chi tiết đơn hàng để bảo vệ lịch sử mua hàng.
 */
@Repository
public interface OrderDetailRepository
        extends JpaRepository<OrderDetail, Integer> {

    /** Giữ lịch sử đơn hàng nếu sản phẩm đã được mua. */
    boolean existsByVariant_Product_Id(Integer productId);

    List<OrderDetail> findByOrder_Id(Integer orderId);
}

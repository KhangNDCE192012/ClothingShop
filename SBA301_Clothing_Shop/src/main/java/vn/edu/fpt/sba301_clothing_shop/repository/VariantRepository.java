package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Variant;

import java.util.List;

/**
 * Nguyen Duy Khang
 * Truy cập biến thể và tìm biến thể theo sản phẩm.
 */
@Repository
public interface VariantRepository extends JpaRepository<Variant, Integer> {
    /** Lấy biến thể để xóa trước sản phẩm. */
    List<Variant> findAllByProduct_Id(Integer productId);
    List<VariantResponse> findVariantsByProductId(Integer id);
}

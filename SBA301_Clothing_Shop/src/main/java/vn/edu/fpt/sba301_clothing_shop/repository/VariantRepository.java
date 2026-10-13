package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Variant;

import java.util.List;

@Repository
public interface VariantRepository extends JpaRepository<Variant, Integer> {
    List<VariantResponse> findVariantsByProductId(Integer id);
}

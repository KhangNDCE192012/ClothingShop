package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.Category;

/**
 * Repository thao tác dữ liệu Category và kiểm tra trùng tên cho BL-012.
 */
@Repository
public interface CategoryRepository
        extends JpaRepository<Category, Integer> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);
}

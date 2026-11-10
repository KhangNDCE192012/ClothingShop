package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductListResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;

import java.util.List;
import java.util.Optional;

/**
 * Nguyen Duy Khang
 * Truy cập dữ liệu sản phẩm cho danh sách quản lý và khu vực nổi bật trên Home.
 */
@Repository
public interface ProductRepository
        extends JpaRepository<Product, Integer> {

    /**
     * Gom Product, Category và Variant trong một truy vấn.
     * MIN(price) là giá thấp nhất; MIN(image) chọn một ảnh đại diện có sẵn.
     */
    @Query("""
            select new vn.edu.fpt.sba301_clothing_shop.dto.response.ProductListResponse(
                p.id, p.name, c.id, c.name, p.status, p.createdAt,
                min(v.image), min(v.price)
            )
            from Product p
            join p.category c
            left join Variant v on v.product = p
            group by p.id, p.name, c.id, c.name, p.status, p.createdAt
            order by p.createdAt desc, p.id desc
            """)
    List<ProductListResponse> findProductSummaries();

    /**
     * Lấy đúng Product theo ID và tải Category trong cùng truy vấn cho BL-011.
     */
    @EntityGraph(attributePaths = "category")
    Optional<Product> findProductById(Integer id);

    /** Đếm Product đang dùng Category để tránh xóa gây mất liên kết dữ liệu. */
    long countByCategoryId(Integer categoryId);
}

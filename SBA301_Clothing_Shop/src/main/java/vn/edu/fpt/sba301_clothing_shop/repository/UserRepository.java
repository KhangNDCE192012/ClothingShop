package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.User;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn dữ liệu bảng Users trong cơ sở dữ liệu.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    /**
     * Tìm tài khoản theo username (không phân biệt chữ hoa/thường), nạp kèm quan hệ Role bằng EntityGraph.
     *
     * @param username Tên đăng nhập
     * @return Optional chứa User nếu tìm thấy
     */
    @EntityGraph(attributePaths = "role")
    Optional<User> findByUsernameIgnoreCase(String username);

    /**
     * BL-031: Lấy danh sách tài khoản theo tên vai trò (ví dụ "CUSTOMER"), sắp xếp giảm dần theo ngày tạo.
     * Nạp kèm quan hệ Role bằng EntityGraph để tránh lỗi LazyLoading.
     *
     * @param roleName Tên vai trò cần lọc
     * @return Danh sách User tương ứng
     */
    @EntityGraph(attributePaths = "role")
    List<User> findAllByRoleNameIgnoreCaseOrderByCreatedAtDesc(String roleName);

    /**
     * Tìm tài khoản theo ID và tên vai trò.
     *
     * @param id Mã định danh tài khoản
     * @param roleName Tên vai trò
     * @return Optional chứa User nếu khớp cả ID và vai trò
     */
    @EntityGraph(attributePaths = "role")
    Optional<User> findByIdAndRoleNameIgnoreCase(Integer id, String roleName);

    /**
     * Đếm số lượng đơn hàng của một người dùng trong bảng Orders.
     * Dùng để kiểm tra ràng buộc trước khi xóa khách hàng (BL-033).
     *
     * @param userId Mã định danh người dùng
     * @return Số lượng đơn hàng đã tạo
     */
    @Query(value = "SELECT COUNT(*) FROM Orders WHERE user_id = :userId", nativeQuery = true)
    long countOrdersByUserId(@Param("userId") Integer userId);

    /**
     * Xóa toàn bộ giỏ hàng của người dùng trong bảng Carts.
     * Dọn dẹp dữ liệu con trước khi xóa tài khoản khách hàng (BL-033).
     *
     * @param userId Mã định danh người dùng
     */
    @Modifying
    @Query(value = "DELETE FROM Carts WHERE user_id = :userId", nativeQuery = true)
    void deleteCartsByUserId(@Param("userId") Integer userId);

    /**
     * Tìm tài khoản theo username chính xác.
     *
     * @param username Tên đăng nhập
     * @return Optional chứa User
     */
    Optional<User> findByUsername(String username);

    /**
     * BL-023: Kiểm tra tên đăng nhập đã tồn tại trong hệ thống chưa (không phân biệt hoa thường).
     *
     * @param username Tên đăng nhập cần kiểm tra
     * @return true nếu đã tồn tại, false nếu chưa
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * BL-023: Kiểm tra email đã tồn tại trong hệ thống chưa (không phân biệt hoa thường).
     *
     * @param email Email cần kiểm tra
     * @return true nếu đã tồn tại, false nếu chưa
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * BL-034: Kiểm tra email đã tồn tại ở bất kỳ tài khoản nào khác ngoại trừ tài khoản có id truyền vào.
     *
     * @param email Email cần kiểm tra
     * @param id Mã định danh của tài khoản hiện tại đang sửa
     * @return true nếu email đã bị tài khoản khác sử dụng
     */
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);
}

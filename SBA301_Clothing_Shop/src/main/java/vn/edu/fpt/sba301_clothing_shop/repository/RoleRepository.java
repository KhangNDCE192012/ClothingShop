package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;

import java.util.Optional;

/**
 * Repository truy vấn dữ liệu bảng Roles (ADMIN, STAFF, CUSTOMER).
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    /**
     * Tìm đối tượng Role theo tên (không phân biệt chữ hoa/thường).
     *
     * @param name Tên vai trò (ví dụ: "CUSTOMER", "ADMIN")
     * @return Optional chứa Role nếu tìm thấy
     */
    Optional<Role> findByNameIgnoreCase(String name);
}

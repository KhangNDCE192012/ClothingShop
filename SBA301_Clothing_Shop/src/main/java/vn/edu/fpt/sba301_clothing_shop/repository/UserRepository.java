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

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    @EntityGraph(attributePaths = "role")
    Optional<User> findByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = "role")
    List<User> findAllByRoleNameIgnoreCaseOrderByCreatedAtDesc(String roleName);

    @EntityGraph(attributePaths = "role")
    Optional<User> findByIdAndRoleNameIgnoreCase(Integer id, String roleName);

    @Query(value = "SELECT COUNT(*) FROM Orders WHERE user_id = :userId", nativeQuery = true)
    long countOrdersByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query(value = "DELETE FROM Carts WHERE user_id = :userId", nativeQuery = true)
    void deleteCartsByUserId(@Param("userId") Integer userId);
}

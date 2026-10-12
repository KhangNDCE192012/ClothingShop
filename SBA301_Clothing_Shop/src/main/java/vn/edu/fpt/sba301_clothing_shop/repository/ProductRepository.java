package vn.edu.fpt.sba301_clothing_shop.repository;

import org.springframework.stereotype.Repository;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface ProductRepository
        extends JpaRepository<Product, Integer> {
}
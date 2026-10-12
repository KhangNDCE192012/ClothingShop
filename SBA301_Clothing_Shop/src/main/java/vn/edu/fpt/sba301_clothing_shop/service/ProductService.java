package vn.edu.fpt.sba301_clothing_shop.service;


import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;
import vn.edu.fpt.sba301_clothing_shop.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }


    public ProductDetailResponse getProductById(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product ID must be greater than 0"
            );
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found with id: " + id
                ));

        return ProductDetailResponse.from(product);
    }
}
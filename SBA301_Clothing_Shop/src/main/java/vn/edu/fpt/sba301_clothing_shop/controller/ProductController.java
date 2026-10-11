package vn.edu.fpt.sba301_clothing_shop.controller;


import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getProductById(
            @PathVariable Integer id
    ) {
        ProductDetailResponse response =
                productService.getProductById(id);

        return ResponseEntity.ok(response);
    }
}
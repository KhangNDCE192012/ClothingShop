package vn.edu.fpt.sba301_clothing_shop.controller;


import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.service.VariantService;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final VariantService variantService;

    public ProductController(ProductService productService, VariantService variantService) {
        this.productService = productService;
        this.variantService = variantService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<VariantResponse>> getProductById(
            @PathVariable Integer id
    ) {
        List<VariantResponse> listVariant =
                variantService.getVariantsByProductId(id);

        return ResponseEntity.ok(listVariant);
    }
}
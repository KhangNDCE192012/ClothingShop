package vn.edu.fpt.sba301_clothing_shop.controller;


import jakarta.validation.Valid;
import vn.edu.fpt.sba301_clothing_shop.dto.request.ProductCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductListResponse;
import vn.edu.fpt.sba301_clothing_shop.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Cung cấp API danh sách và chi tiết sản phẩm cho các chức năng Product/Home.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Trả danh sách cho Home BL-003 và trang quản lý BL-006.
     * Đây là dữ liệu đọc công khai; thao tác quản trị vẫn được bảo vệ riêng.
     */
    @GetMapping
    public ResponseEntity<List<ProductListResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    /** BL-007: nhận dữ liệu hợp lệ và trả product vừa tạo với HTTP 201. */
    @PostMapping
    public ResponseEntity<ProductListResponse> createProduct(
            @Valid @RequestBody ProductCreateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    /**
     * BL-011: lấy đúng một product theo ID; service xử lý lỗi ID và dữ liệu không tồn tại.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getProductById(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(productService.getProductById(id));
    }
}

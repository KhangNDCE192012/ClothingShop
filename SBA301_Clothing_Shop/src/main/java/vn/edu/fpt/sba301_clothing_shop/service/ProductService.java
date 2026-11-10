package vn.edu.fpt.sba301_clothing_shop.service;


import vn.edu.fpt.sba301_clothing_shop.dto.request.ProductCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductListResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Category;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;
import vn.edu.fpt.sba301_clothing_shop.repository.CategoryRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.ProductRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.LocalDateTime;

/**
 * Xử lý nghiệp vụ đọc và tạo sản phẩm cho các chức năng Product/Home.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            VariantRepository variantRepository,
            CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Lấy danh sách đã sắp xếp mới nhất trước và chỉ trả DTO cần cho giao diện.
     */
    @Transactional(readOnly = true)
    public List<ProductListResponse> getAllProducts() {
        return productRepository.findProductSummaries();
    }

    /**
     * BL-007: kiểm tra category, chuẩn hóa dữ liệu và lưu Product mới.
     */
    @Transactional
    public ProductListResponse createProduct(ProductCreateRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy danh mục có ID: " + request.categoryId()
                ));

        Product product = new Product();
        product.setName(request.name().trim());
        product.setCategory(category);
        product.setStatus(normalizeStatus(request.status()));
        product.setCreatedAt(LocalDateTime.now());

        Product savedProduct = productRepository.save(product);

        return new ProductListResponse(
                savedProduct.getId(),
                savedProduct.getName(),
                category.getId(),
                category.getName(),
                savedProduct.getStatus(),
                savedProduct.getCreatedAt(),
                null,
                null
        );
    }

    /** Nếu frontend không gửi status thì sản phẩm mới mặc định ACTIVE. */
    private String normalizeStatus(String status) {
        return status == null || status.isBlank()
                ? "ACTIVE"
                : status.trim().toUpperCase();
    }

    /**
     * Kiểm tra ID, tìm Product và ghép variants để tạo response chi tiết BL-011.
     */
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product ID phải lớn hơn 0"
            );
        }

        Product product = productRepository.findProductById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy sản phẩm có ID: " + id
                ));

        List<VariantResponse> variants = variantRepository.findVariantsByProductId(id);

        return ProductDetailResponse.from(product, variants);
    }
}

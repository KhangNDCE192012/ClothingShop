package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.stereotype.Service;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CategoryResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Category;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;
import vn.edu.fpt.sba301_clothing_shop.repository.CategoryRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.ProductRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            VariantRepository variantRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    public List<CategoryResponse> getAllCategories() {

        List<Category> categories = categoryRepository.findAll();

        List<Product> products = productRepository.findAll();

        return categories.stream()
                .map(category ->
                        buildCategoryResponse(category, products)
                )
                .toList();
    }

    private CategoryResponse buildCategoryResponse(
            Category category,
            List<Product> products
    ) {

        // Lấy các product thuộc category hiện tại
        List<Product> categoryProducts = products.stream()
                .filter(product ->
                        product.getCategory() != null
                                && Objects.equals(
                                product.getCategory().getId(),
                                category.getId()
                        )
                )
                .filter(product ->
                        "ACTIVE".equalsIgnoreCase(product.getStatus())
                )
                .toList();

        // Lấy tất cả variant của các product trên
        List<VariantResponse> variants = categoryProducts.stream()
                .flatMap(product ->
                        variantRepository
                                .findVariantsByProductId(product.getId())
                                .stream()
                )
                .toList();

        // Tìm giá thấp nhất
        BigDecimal minPrice = variants.stream()
                .map(VariantResponse::price)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(null);

        // Lấy một ảnh đại diện hợp lệ
        String image = variants.stream()
                .map(VariantResponse::image)
                .filter(Objects::nonNull)
                .filter(img -> !img.isBlank())
                .findFirst()
                .orElse(null);

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                image,
                minPrice
        );
    }
}
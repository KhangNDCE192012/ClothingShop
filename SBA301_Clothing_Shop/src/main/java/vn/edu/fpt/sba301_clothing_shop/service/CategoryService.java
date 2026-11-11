package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CategoryRequest;
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

/**
 * Xử lý đọc, tạo, đổi tên và xóa Category trong module Product BL-012.
 */
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

    /**
     * Lấy toàn bộ danh sách danh mục cùng với ảnh đại diện và mức giá thấp nhất của các sản phẩm thuộc danh mục.
     *
     * @return danh sách CategoryResponse
     */
    public List<CategoryResponse> getAllCategories() {

        List<Category> categories = categoryRepository.findAll();

        List<Product> products = productRepository.findAll();

        return categories.stream()
                .map(category ->
                        buildCategoryResponse(category, products)
                )
                .toList();
    }

    /** Tạo Category mới sau khi chuẩn hóa và kiểm tra trùng tên. */
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String name = normalizeName(request.name());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên danh mục đã tồn tại"
            );
        }

        Category category = new Category();
        category.setName(name);
        Category savedCategory = categoryRepository.save(category);
        return CategoryResponse.fromBasic(savedCategory.getId(), savedCategory.getName());
    }

    /** Đổi tên Category nhưng không cho phép trùng tên với Category khác. */
    @Transactional
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = findCategory(id);
        String name = normalizeName(request.name());

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên danh mục đã tồn tại"
            );
        }

        category.setName(name);
        Category savedCategory = categoryRepository.save(category);
        return CategoryResponse.fromBasic(savedCategory.getId(), savedCategory.getName());
    }

    /** Chỉ xóa Category chưa được Product nào sử dụng. */
    @Transactional
    public void deleteCategory(Integer id) {
        Category category = findCategory(id);

        if (productRepository.countByCategoryId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa danh mục đang có sản phẩm"
            );
        }

        categoryRepository.delete(category);
    }

    private Category findCategory(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category ID phải lớn hơn 0");
        }

        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy danh mục có ID: " + id
                ));
    }

    private String normalizeName(String name) {
        return name.trim();
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

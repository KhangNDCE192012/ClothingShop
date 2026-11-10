package vn.edu.fpt.sba301_clothing_shop.service;


import vn.edu.fpt.sba301_clothing_shop.dto.request.ProductCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.VariantCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductDetailResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.ProductListResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Category;
import vn.edu.fpt.sba301_clothing_shop.entity.Product;
import vn.edu.fpt.sba301_clothing_shop.entity.Variant;
import vn.edu.fpt.sba301_clothing_shop.repository.CategoryRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.CartRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.OrderDetailRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.ProductRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * Nguyen Duy Khang
 * Xử lý đọc, tạo, sửa và xóa sản phẩm trong Product Management/Home.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final CartRepository cartRepository;
    private final OrderDetailRepository orderDetailRepository;

    public ProductService(
            ProductRepository productRepository,
            VariantRepository variantRepository,
            CategoryRepository categoryRepository,
            CartRepository cartRepository,
            OrderDetailRepository orderDetailRepository
    ) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.categoryRepository = categoryRepository;
        this.cartRepository = cartRepository;
        this.orderDetailRepository = orderDetailRepository;
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
        if (request.variants() == null || request.variants().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần ít nhất một biến thể sản phẩm");
        }
        Category category = findCategory(request.categoryId());
        if (request.variants().stream().anyMatch(item -> item.id() != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biến thể mới không được có ID");
        }

        Product product = new Product();
        product.setName(request.name().trim());
        product.setCategory(category);
        product.setStatus(normalizeStatus(request.status()));
        product.setCreatedAt(LocalDateTime.now());

        Product savedProduct = productRepository.save(product);

        // Cùng transaction: nếu một Variant lưu lỗi, Product cũng được rollback.
        List<Variant> variants = request.variants().stream()
                .map(item -> fillVariant(new Variant(), savedProduct, item)).toList();
        variantRepository.saveAll(variants);
        BigDecimal minPrice = variants.stream().map(Variant::getPrice)
                .min(BigDecimal::compareTo).orElseThrow();

        return new ProductListResponse(
                savedProduct.getId(),
                savedProduct.getName(),
                category.getId(),
                category.getName(),
                savedProduct.getStatus(),
                savedProduct.getCreatedAt(),
                variants.get(0).getImage(),
                minPrice
        );
    }

    /**
     * BL-008/BL-010: sửa Product và tồn kho từng Variant trong cùng transaction, giữ ID và ngày tạo.
     * Variant cũ không bị xóa vì Cart/OrderDetails có thể đang tham chiếu.
     */
    @Transactional
    public ProductListResponse updateProduct(Integer id, ProductCreateRequest request) {
        Product product = findProduct(id);
        Category category = findCategory(request.categoryId());
        if (request.variants() != null) {
            long idCount = request.variants().stream().map(VariantCreateRequest::id)
                    .filter(Objects::nonNull).count();
            long uniqueIdCount = request.variants().stream().map(VariantCreateRequest::id)
                    .filter(Objects::nonNull).distinct().count();
            if (idCount != uniqueIdCount) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Một biến thể không được gửi lặp lại nhiều lần");
            }
        }

        // Kiểm tra quyền sở hữu toàn bộ ID trước khi thay đổi bất kỳ dữ liệu nào.
        List<Variant> variants = request.variants() == null ? null : request.variants().stream()
                .map(item -> {
                    Variant variant = item.id() == null ? new Variant() : variantRepository.findById(item.id())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Không tìm thấy biến thể có ID: " + item.id()));
                    if (item.id() != null && !variant.getProduct().getId().equals(id)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Biến thể không thuộc sản phẩm đang sửa");
                    }
                    return fillVariant(variant, product, item);
                }).toList();

        product.setName(request.name().trim());
        product.setCategory(category);
        product.setStatus(normalizeStatus(request.status()));

        Product savedProduct = productRepository.save(product);
        if (variants != null) variantRepository.saveAll(variants);
        List<VariantResponse> currentVariants = variantRepository.findVariantsByProductId(id);
        return new ProductListResponse(
                savedProduct.getId(),
                savedProduct.getName(),
                category.getId(),
                category.getName(),
                savedProduct.getStatus(),
                savedProduct.getCreatedAt(),
                currentVariants.stream().map(VariantResponse::image)
                        .filter(image -> image != null && !image.isBlank()).findFirst().orElse(null),
                currentVariants.stream().map(VariantResponse::price)
                        .min(BigDecimal::compareTo).orElse(null)
        );
    }

    /** BL-009: xóa sản phẩm và dữ liệu phụ thuộc nếu chưa có đơn hàng. */
    @Transactional
    public void deleteProduct(Integer id) {
        Product product = findProduct(id);
        if (orderDetailRepository.existsByVariant_Product_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Không thể xóa sản phẩm đã có trong đơn hàng");
        }

        // Xóa giỏ hàng trước biến thể để không vi phạm khóa ngoại.
        cartRepository.deleteAll(cartRepository.findAllByVariant_Product_Id(id));
        variantRepository.deleteAll(variantRepository.findAllByProduct_Id(id));
        productRepository.delete(product);
    }

    /** Chỉ các trường cho phép sửa được gán vào Variant. */
    private Variant fillVariant(Variant variant, Product product, VariantCreateRequest item) {
        variant.setProduct(product);
        variant.setSize(item.size().trim());
        variant.setColor(item.color().trim());
        variant.setImage(item.image().trim());
        variant.setQuantity(item.quantity());
        variant.setPrice(item.price());
        return variant;
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
        Product product = findProduct(id);
        List<VariantResponse> variants = variantRepository.findVariantsByProductId(id);

        return ProductDetailResponse.from(product, variants);
    }

    /** Kiểm tra ID và tìm Product cho các thao tác đọc, sửa, xóa. */
    private Product findProduct(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product ID phải lớn hơn 0"
            );
        }

        return productRepository.findProductById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy sản phẩm có ID: " + id
                ));
    }

    /** Kiểm tra Category được chọn có tồn tại trước khi lưu Product. */
    private Category findCategory(Integer categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy danh mục có ID: " + categoryId
                ));
    }
}

package vn.edu.fpt.sba301_clothing_shop;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.sba301_clothing_shop.dto.request.ProductCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.VariantCreateRequest;
import vn.edu.fpt.sba301_clothing_shop.repository.CategoryRepository;
import vn.edu.fpt.sba301_clothing_shop.service.ProductService;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Nguyen Duy Khang
 * Kiểm tra tạo, sửa, xóa sản phẩm và tồn kho; dữ liệu test được rollback.
 */
@SpringBootTest
@Transactional
class ProductCreateIntegrationTests {

    @Autowired ProductService productService;
    @Autowired CategoryRepository categoryRepository;

    @Test
    void createdProductHasVariantInListAndDetail() {
        Integer categoryId = categoryRepository.findAll().getFirst().getId();
        var request = new ProductCreateRequest(
                "BL007 integration test", categoryId, "ACTIVE",
                List.of(new VariantCreateRequest(
                        "M", "Blue", "https://example.com/test.jpg", 3, new BigDecimal("125000")))
        );

        var created = productService.createProduct(request);
        var detail = productService.getProductById(created.id());
        var listed = productService.getAllProducts().stream()
                .filter(item -> item.id().equals(created.id())).findFirst().orElseThrow();

        assertEquals("BL007 integration test", detail.name());
        assertEquals(1, detail.variants().size());
        assertEquals("Blue", detail.variants().getFirst().color());
        assertEquals(new BigDecimal("125000.00"), listed.minPrice());
        assertEquals("https://example.com/test.jpg", listed.image());
    }

    @Test
    void updateKeepsExistingVariantIdAndAddsNewVariant() {
        Integer categoryId = categoryRepository.findAll().getFirst().getId();
        var created = productService.createProduct(new ProductCreateRequest(
                "Before edit", categoryId, "ACTIVE",
                List.of(new VariantCreateRequest("M", "Blue", "https://example.com/old.jpg",
                        3, new BigDecimal("125000")))));
        var before = productService.getProductById(created.id());
        Integer oldVariantId = before.variants().getFirst().id();

        productService.updateProduct(created.id(), new ProductCreateRequest(
                "After edit", categoryId, "INACTIVE",
                List.of(
                        new VariantCreateRequest(oldVariantId, "L", "Red",
                                "https://example.com/new.jpg", 7, new BigDecimal("130000")),
                        new VariantCreateRequest("S", "Black",
                                "https://example.com/black.jpg", 2, new BigDecimal("110000"))
                )));

        var detail = productService.getProductById(created.id());
        assertEquals("After edit", detail.name());
        assertEquals("INACTIVE", detail.status());
        assertEquals(before.createdAt(), detail.createdAt());
        assertEquals(2, detail.variants().size());
        var editedVariant = detail.variants().stream()
                .filter(item -> item.id().equals(oldVariantId)).findFirst().orElseThrow();
        assertEquals("Red", editedVariant.color());
        assertEquals(7, editedVariant.quantity());
        assertEquals("https://example.com/new.jpg", editedVariant.image());
        var listed = productService.getAllProducts().stream()
                .filter(item -> item.id().equals(created.id())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("110000.00"), listed.minPrice());
    }

    @Test
    void updateStockToZeroKeepsVariantAndDisplaysNewQuantity() {
        Integer categoryId = categoryRepository.findAll().getFirst().getId();
        var created = productService.createProduct(new ProductCreateRequest(
                "Stock test", categoryId, "ACTIVE",
                List.of(new VariantCreateRequest("M", "Blue", "https://example.com/stock.jpg",
                        5, new BigDecimal("100000")))));
        var before = productService.getProductById(created.id());
        Integer variantId = before.variants().getFirst().id();

        // BL-010 dùng cùng PUT sản phẩm, chỉ thay quantity của biến thể đã có.
        productService.updateProduct(created.id(), new ProductCreateRequest(
                before.name(), categoryId, before.status(),
                List.of(new VariantCreateRequest(variantId, "M", "Blue",
                        "https://example.com/stock.jpg", 0, new BigDecimal("100000")))));

        var after = productService.getProductById(created.id());
        assertEquals(variantId, after.variants().getFirst().id());
        assertEquals(0, after.variants().getFirst().quantity());
        assertEquals(before.createdAt(), after.createdAt());
    }

    @Test
    void deleteRemovesOnlyRequestedProductAndItsVariants() {
        Integer categoryId = categoryRepository.findAll().getFirst().getId();
        var request = new ProductCreateRequest("Delete test", categoryId, "ACTIVE",
                List.of(new VariantCreateRequest("M", "Blue", "https://example.com/delete.jpg",
                        2, new BigDecimal("100000"))));
        var removed = productService.createProduct(request);
        var retained = productService.createProduct(request);

        productService.deleteProduct(removed.id());

        assertTrue(productService.getAllProducts().stream()
                .noneMatch(item -> item.id().equals(removed.id())));
        assertNotNull(productService.getProductById(retained.id()));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> productService.getProductById(removed.id()));
    }
}

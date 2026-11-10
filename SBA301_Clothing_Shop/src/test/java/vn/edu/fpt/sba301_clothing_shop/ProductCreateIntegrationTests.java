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
 * Kiểm tra Product và Variant của BL-007 được lưu cùng nhau; dữ liệu test được rollback.
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
}

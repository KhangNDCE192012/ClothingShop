package vn.edu.fpt.sba301_clothing_shop.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CategoryRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CategoryResponse;
import vn.edu.fpt.sba301_clothing_shop.service.CategoryService;

import java.util.List;

/**
 * Controller quản lý danh mục sản phẩm (Category Management).
 * Cung cấp API đọc công khai (Public) và API ghi dành riêng cho ADMIN (BL-012, BL-028).
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService
    ) {
        this.categoryService = categoryService;
    }

    /**
     * BL-003 & BL-004: Lấy danh sách toàn bộ danh mục sản phẩm kèm sản phẩm mẫu.
     * Phương thức: GET /api/categories
     * Quyền hạn: Công khai (PermitAll)
     *
     * @return Danh sách CategoryResponse
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>>
    getAllCategories() {
        // 1. Gọi CategoryService để lấy toàn bộ danh mục sản phẩm kèm ảnh và giá thấp nhất
        // 2. Trả về mã HTTP 200 OK kèm danh sách kết quả cho client
        return ResponseEntity.ok(
                categoryService.getAllCategories()
        );
    }

    /**
     * BL-012: Thêm danh mục sản phẩm mới (chỉ Admin).
     * Phương thức: POST /api/categories
     * Quyền hạn: ADMIN
     *
     * @param request DTO chứa tên danh mục mới
     * @return HTTP 201 Created cùng CategoryResponse vừa tạo
     */
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request
    ) {
        // 1. Gọi Service tạo danh mục sau khi kiểm tra tính hợp lệ và không trùng tên
        // 2. Trả về mã HTTP 201 Created cùng đối tượng CategoryResponse vừa lưu
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(categoryService.createCategory(request));
    }

    /**
     * BL-012: Chỉnh sửa tên danh mục sản phẩm theo ID (chỉ Admin).
     * Phương thức: PUT /api/categories/{id}
     * Quyền hạn: ADMIN
     *
     * @param id Mã định danh danh mục
     * @param request DTO chứa tên mới
     * @return CategoryResponse sau khi cập nhật
     */
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody CategoryRequest request
    ) {
        // 1. Gọi Service cập nhật tên danh mục theo ID
        // 2. Trả về mã HTTP 200 OK cùng dữ liệu mới sau khi sửa
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    /**
     * BL-012: Xóa danh mục sản phẩm theo ID (chỉ Admin, chỉ xóa khi chưa có sản phẩm nào).
     * Phương thức: DELETE /api/categories/{id}
     * Quyền hạn: ADMIN
     *
     * @param id Mã định danh danh mục
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        // 1. Gọi Service thực hiện xóa danh mục (sẽ kiểm tra nếu có sản phẩm thì ném lỗi 409 Conflict)
        categoryService.deleteCategory(id);
        // 2. Trả về mã HTTP 204 No Content thông báo xóa thành công
        return ResponseEntity.noContent().build();
    }
}

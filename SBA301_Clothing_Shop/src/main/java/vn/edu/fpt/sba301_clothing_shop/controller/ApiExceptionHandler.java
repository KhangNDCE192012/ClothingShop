package vn.edu.fpt.sba301_clothing_shop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Bộ xử lý ngoại lệ toàn cục cho các API Controller (Global Exception Handler).
 * Chuyển đổi các ngoại lệ thành phản hồi JSON có cấu trúc tiếng Việt chuẩn.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * Xử lý các ngoại lệ ResponseStatusException do tầng Service ném ra (400, 404, 409...).
     *
     * @param exception Ngoại lệ ResponseStatusException
     * @return ResponseEntity chứa map message lỗi
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException exception) {
        // 1. Trích xuất lý do lỗi (reason) từ exception, nếu null thì dùng thông báo mặc định
        String message = exception.getReason() == null
                ? "Yêu cầu không thể thực hiện"
                : exception.getReason();

        // 2. Trả về đối tượng phản hồi HTTP với mã trạng thái lỗi tương ứng và body JSON {"message": "..."}
        return ResponseEntity
                .status(exception.getStatusCode())
                .body(Map.of("message", message));
    }

    /**
     * Xử lý lỗi kiểm tra tính hợp lệ dữ liệu đầu vào (@Valid MethodArgumentNotValidException).
     *
     * @param exception Ngoại lệ validation
     * @return HTTP 400 Bad Request kèm thông báo lỗi cụ thể của trường vi phạm
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        // 1. Lấy danh sách lỗi trường (field errors) từ bindingResult và chọn lỗi đầu tiên
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null
                        ? "Dữ liệu đăng nhập không hợp lệ"
                        : error.getDefaultMessage())
                .orElse("Dữ liệu đăng nhập không hợp lệ");

        // 2. Trả về mã lỗi HTTP 400 Bad Request cùng thông báo vi phạm cụ thể
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}

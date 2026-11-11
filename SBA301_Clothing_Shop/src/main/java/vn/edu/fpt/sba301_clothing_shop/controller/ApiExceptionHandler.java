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
        String message = exception.getReason() == null
                ? "Yêu cầu không thể thực hiện"
                : exception.getReason();
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
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null
                        ? "Dữ liệu đăng nhập không hợp lệ"
                        : error.getDefaultMessage())
                .orElse("Dữ liệu đăng nhập không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}

package vn.edu.fpt.sba301_clothing_shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Điểm khởi chạy chính của ứng dụng SBA301 Clothing Shop Backend (Spring Boot).
 * Khởi động ngữ cảnh ứng dụng, quét component, cấu hình bảo mật và kết nối cơ sở dữ liệu.
 */
@SpringBootApplication
public class Sba301ClothingShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(Sba301ClothingShopApplication.class, args);
    }
}

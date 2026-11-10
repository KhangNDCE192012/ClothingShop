package vn.edu.fpt.sba301_clothing_shop.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * BL-027: Bộ mã hóa mật khẩu tương thích ngược sử dụng chuẩn BCryptPasswordEncoder.
 * Chức năng:
 * - Mã hóa tất cả mật khẩu mới tạo ra dạng băm BCrypt ($2a$, $2b$, $2y$).
 * - So khớp mật khẩu đăng nhập với chuỗi băm trong Database.
 * - Hỗ trợ các tài khoản seed ban đầu (plain text) và tự động nâng cấp sang BCrypt khi đăng nhập.
 */
public class LegacyCompatiblePasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    /**
     * BL-027: Băm mật khẩu thô thành chuỗi BCrypt hash độ dài 60 ký tự.
     *
     * @param rawPassword Mật khẩu thô người dùng nhập
     * @return Chuỗi băm BCrypt an toàn
     */
    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    /**
     * So khớp mật khẩu người dùng nhập với mật khẩu lưu trong cơ sở dữ liệu.
     *
     * @param rawPassword Mật khẩu thô người dùng nhập vào form
     * @param encodedPassword Chuỗi mật khẩu lấy từ cơ sở dữ liệu
     * @return true nếu mật khẩu khớp, false nếu sai
     */
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) return false;

        // Nếu mật khẩu trong DB đã là hash BCrypt ($2a$, $2b$, $2y$)
        if (encodedPassword.startsWith("$2a$")
                || encodedPassword.startsWith("$2b$")
                || encodedPassword.startsWith("$2y$")) {
            return bcrypt.matches(rawPassword, encodedPassword);
        }

        // Hỗ trợ tạm thời tài khoản seed cũ chưa kịp hash (so sánh an toàn tránh Timing Attack)
        return MessageDigest.isEqual(
                rawPassword.toString().getBytes(StandardCharsets.UTF_8),
                encodedPassword.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Kiểm tra xem mật khẩu có cần nâng cấp sang BCrypt không.
     * Trả về true nếu mật khẩu trong DB chưa bắt đầu bằng $2.
     *
     * @param encodedPassword Mật khẩu hiện tại trong DB
     * @return true nếu cần băm lại bằng BCrypt
     */
    @Override
    public boolean upgradeEncoding(String encodedPassword) {
        return encodedPassword == null || !encodedPassword.startsWith("$2");
    }
}

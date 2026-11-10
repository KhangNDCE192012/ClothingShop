package vn.edu.fpt.sba301_clothing_shop.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * BL-025: Dịch vụ quản lý JWT (JSON Web Token).
 * Chịu trách nhiệm:
 * - Tạo token mã hóa HMAC-SHA256 với username, role và hạn sử dụng 24 giờ.
 * - Giải mã và kiểm tra tính hợp lệ của token (chữ ký, hạn sử dụng, cờ hoạt động của user).
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMs = expirationMs;
    }

    /**
     * BL-025: Tạo JWT access token cho người dùng sau khi đăng nhập thành công.
     *
     * @param userDetails Đối tượng UserDetails chứa username
     * @param role Vai trò người dùng (CUSTOMER, ADMIN)
     * @return Chuỗi JWT Token đã được ký số
     */
    public String generateToken(UserDetails userDetails, String role) {
        Instant now = Instant.now();

        return Jwts.builder()
                .claims(Map.of("role", role))
                .subject(userDetails.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Trích xuất username (subject) từ chuỗi JWT token.
     *
     * @param token Chuỗi JWT Token
     * @return Username người dùng
     */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * BL-025 & BL-032: Kiểm tra tính hợp lệ của token.
     * Token được coi là hợp lệ khi:
     * 1. Username trong token khớp với UserDetails.
     * 2. Thời điểm hết hạn (expiration) vẫn còn sau thời điểm hiện tại.
     * 3. Tài khoản người dùng vẫn đang hoạt động (userDetails.isEnabled() == true, không bị khóa BANNED).
     *
     * @param token Chuỗi JWT Token
     * @param userDetails Đối tượng UserDetails
     * @return true nếu token hợp lệ, false nếu hết hạn hoặc tài khoản bị khóa
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(userDetails.getUsername())
                && claims.getExpiration().after(new Date())
                && userDetails.isEnabled();
    }

    /**
     * Lấy thời gian hết hạn của token tính bằng giây (phục vụ trả về AuthResponse).
     *
     * @return Số giây hiệu lực của token
     */
    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    /**
     * Giải mã và xác thực chữ ký của JWT token bằng khóa bí mật.
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

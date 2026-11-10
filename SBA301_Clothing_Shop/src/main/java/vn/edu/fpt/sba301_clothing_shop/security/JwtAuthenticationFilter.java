package vn.edu.fpt.sba301_clothing_shop.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * BL-025 & BL-028: Bộ lọc xác thực JWT Token cho mỗi request gửi đến server.
 * Bóc tách header Authorization: Bearer <token>, kiểm tra chữ ký và tính hợp lệ,
 * nạp thông tin quyền hạn (Authorities) vào SecurityContextHolder.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        // Nếu request không có header Authorization hoặc không bắt đầu bằng Bearer -> bỏ qua để filter sau xử lý
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bóc tách lấy phần chuỗi JWT token
        String token = authorization.substring(BEARER_PREFIX.length());

        try {
            // Trích xuất username từ JWT token
            String username = jwtService.extractUsername(token);

            // Nếu username tồn tại và chưa có Authentication trong SecurityContext hiện tại
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                // Nạp UserDetails từ Database theo thời gian thực (để lấy quyền hạn và kiểm tra trạng thái ACTIVE/BANNED)
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // BL-032: isTokenValid kiểm tra cả hạn sử dụng và cờ userDetails.isEnabled()
                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            UsernamePasswordAuthenticationToken.authenticated(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    // Thiết lập danh tính người dùng vào SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ignored) {
            // Nếu token sai chữ ký, hết hạn hoặc user không tồn tại -> xóa sạch SecurityContext
            SecurityContextHolder.clearContext();
        }

        // Tiếp tục chuỗi filter
        filterChain.doFilter(request, response);
    }
}

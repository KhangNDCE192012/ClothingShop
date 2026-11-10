package vn.edu.fpt.sba301_clothing_shop.security.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import vn.edu.fpt.sba301_clothing_shop.security.JwtAuthenticationFilter;
import vn.edu.fpt.sba301_clothing_shop.security.LegacyCompatiblePasswordEncoder;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Cấu hình bảo mật hệ thống toàn diện bằng Spring Security:
 * - BL-027: Mã hóa mật khẩu bằng BCryptPasswordEncoder.
 * - BL-024 & BL-025: Xác thực và quản lý phiên không trạng thái (Stateless) qua JWT Token.
 * - BL-028: Phân quyền truy cập theo vai trò (Role-based Authorization: ADMIN, CUSTOMER, Public).
 * - BL-029: Bảo vệ các API ghi sản phẩm (POST, PUT, DELETE /api/products).
 * - BL-030: Bảo vệ các API quản trị người dùng và đơn hàng (GET /api/users, GET /api/orders).
 */
@Configuration
public class SecurityConfig {

    /**
     * BL-027: Cung cấp Bean mã hóa mật khẩu sử dụng thuật toán BCrypt.
     * Tương thích ngược với các tài khoản seed cũ và tự động nâng cấp sang BCrypt khi đăng nhập.
     *
     * @return PasswordEncoder bean
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new LegacyCompatiblePasswordEncoder();
    }

    /**
     * Cấu hình DaoAuthenticationProvider kết nối UserDetailsService và PasswordEncoder.
     */
    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    /**
     * Cung cấp AuthenticationManager phục vụ xác thực tại AuthenticationService.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * BL-028: Cấu hình chuỗi bộ lọc bảo mật (Security Filter Chain) và ma trận phân quyền.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationProvider authenticationProvider
    ) throws Exception {
        return http
                // Vô hiệu hóa CSRF vì ứng dụng sử dụng JWT Token (Stateless), không dùng Cookie session
                .csrf(csrf -> csrf.disable())
                // Kích hoạt cấu hình CORS mặc định
                .cors(Customizer.withDefaults())
                // Chế độ phiên không lưu trạng thái (Stateless)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .authorizeHttpRequests(authorize -> authorize
                        // 1. Cho phép tất cả request OPTIONS (CORS preflight) và trang /error
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // 2. BL-024 & BL-023: API đăng nhập và đăng ký là công khai (Public)
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()

                        // 3. BL-003: Danh sách và chi tiết sản phẩm / danh mục mở công khai cho khách xem
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**", "/api/categories", "/api/categories/**").permitAll()

                        // 4. BL-029: Thao tác ghi Product (thêm, sửa, xóa) chỉ dành riêng cho ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/products", "/api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products", "/api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products", "/api/products/**").hasRole("ADMIN")

                        // 5. BL-012: Thao tác ghi Category (thêm, sửa, xóa) chỉ dành riêng cho ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/categories", "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")

                        // 6. BL-028: Đơn hàng & Giỏ hàng dành cho người dùng đã đăng nhập (Customer / Admin)
                        .requestMatchers(HttpMethod.POST, "/api/orders/checkout").authenticated()
                        .requestMatchers("/api/carts", "/api/carts/**").authenticated()

                        // 7. BL-030: Lấy thông tin tài khoản cá nhân (/users/me) cho người dùng đăng nhập
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()

                        // 8. BL-030: Quản lý người dùng và Quản trị đơn hàng chỉ dành riêng cho ADMIN
                        .requestMatchers("/api/users", "/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/orders/manage/**", "/api/orders", "/api/orders/**").hasRole("ADMIN")

                        // 9. Bất kỳ request nào khác đều bắt buộc phải đăng nhập
                        .anyRequest().authenticated())
                // Xử lý ngoại lệ chuẩn hóa trả về JSON tiếng Việt UTF-8
                .exceptionHandling(exceptions -> exceptions
                        // Khi chưa đăng nhập (Thiếu token hoặc token không hợp lệ) -> trả 401 Unauthorized
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setCharacterEncoding("UTF-8");
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            response.getWriter().write("{\"message\":\"Bạn cần đăng nhập để sử dụng chức năng này\"}");
                        })
                        // Khi đã đăng nhập nhưng không đủ quyền hạn (vd: Customer gọi API Admin) -> trả 403 Forbidden
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setCharacterEncoding("UTF-8");
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            response.getWriter().write("{\"message\":\"Bạn không có quyền thực hiện thao tác này\"}");
                        }))
                // Đặt bộ lọc JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}

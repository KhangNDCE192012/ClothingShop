package vn.edu.fpt.sba301_clothing_shop.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Triển khai UserDetailsService của Spring Security.
 * Chịu trách nhiệm nạp thông tin người dùng từ Database, kiểm tra trạng thái khóa (BL-032)
 * và chuẩn hóa quyền hạn (Authorities: ROLE_ADMIN, ROLE_CUSTOMER) phục vụ phân quyền (BL-028).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Nạp người dùng theo username từ bảng Users trong Database.
     *
     * @param username Tên đăng nhập
     * @return UserDetails chứa username, password hash, authorities và cờ disabled
     * @throws UsernameNotFoundException khi không tìm thấy tài khoản
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() -> new UsernameNotFoundException("Sai username hoặc password"));

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                // BL-028: Gán quyền dạng ROLE_ADMIN hoặc ROLE_CUSTOMER cho Spring Security
                .authorities("ROLE_" + user.getRole().getName().toUpperCase())
                // BL-032: Nếu trạng thái không phải ACTIVE (ví dụ BANNED) -> disabled = true
                .disabled(!ACTIVE_STATUS.equalsIgnoreCase(user.getStatus()))
                .build();
    }
}

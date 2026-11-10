package vn.edu.fpt.sba301_clothing_shop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.LoginRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.RegisterRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.AuthResponse;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.repository.RoleRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;
import vn.edu.fpt.sba301_clothing_shop.security.CustomUserDetailsService;
import vn.edu.fpt.sba301_clothing_shop.security.JwtService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserDetails userDetails;

    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        authenticationService = new AuthenticationService(
                authenticationManager,
                userDetailsService,
                userRepository,
                roleRepository,
                jwtService,
                passwordEncoder
        );
    }

    @Test
    void testLoginWithPlainTextPasswordUpgradesToBcrypt() {
        LoginRequest request = new LoginRequest("testuser", "plain123");
        Role role = new Role();
        role.setName("CUSTOMER");
        User user = new User(1, "testuser", "plain123", role);

        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.upgradeEncoding("plain123")).thenReturn(true);
        when(passwordEncoder.encode("plain123")).thenReturn("$2a$10$hashedPassword123");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails, "CUSTOMER")).thenReturn("jwt-token-123");
        when(jwtService.getExpirationSeconds()).thenReturn(86400L);

        AuthResponse response = authenticationService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.token());
        assertEquals("$2a$10$hashedPassword123", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void testLoginWithBcryptPasswordDoesNotUpgradeAgain() {
        LoginRequest request = new LoginRequest("testuser", "securePass");
        Role role = new Role();
        role.setName("ADMIN");
        User user = new User(2, "testuser", "$2a$10$alreadyBcryptHash", role);

        when(userRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.upgradeEncoding("$2a$10$alreadyBcryptHash")).thenReturn(false);
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtService.generateToken(userDetails, "ADMIN")).thenReturn("jwt-admin-token");
        when(jwtService.getExpirationSeconds()).thenReturn(86400L);

        AuthResponse response = authenticationService.login(request);

        assertNotNull(response);
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testLoginLockedAccountThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("bannedUser", "pass");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("Account disabled"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.login(request));

        assertEquals(401, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("khóa"));
    }

    @Test
    void testLoginBadCredentialsThrowsUnauthorized() {
        LoginRequest request = new LoginRequest("user", "wrongPass");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.login(request));

        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("BL-023: Đăng ký thành công - mật khẩu băm BCrypt, vai trò CUSTOMER, trạng thái ACTIVE")
    void testRegisterSuccessStoresBcryptPasswordAndCustomerRole() {
        RegisterRequest request = new RegisterRequest(
                "newcustomer",
                "Password123",
                "NewCustomer@example.com",
                "Nguyen Van A",
                "0987654321"
        );
        Role customerRole = new Role();
        customerRole.setId(3);
        customerRole.setName("CUSTOMER");

        when(userRepository.existsByUsernameIgnoreCase("newcustomer")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("newcustomer@example.com")).thenReturn(false);
        when(roleRepository.findByNameIgnoreCase("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode("Password123")).thenReturn("$2a$10$hashedBcryptPassword123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10);
            return u;
        });

        UserResponse response = authenticationService.register(request);

        assertNotNull(response);
        assertEquals(10, response.id());
        assertEquals("newcustomer", response.username());
        assertEquals("newcustomer@example.com", response.email());
        assertEquals("Nguyen Van A", response.fullName());
        assertEquals("0987654321", response.phone());
        assertEquals("CUSTOMER", response.role());
        assertEquals("ACTIVE", response.status());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("$2a$10$hashedBcryptPassword123", saved.getPassword());
        assertNotEquals("Password123", saved.getPassword());
        assertEquals("CUSTOMER", saved.getRole().getName());
        assertEquals("ACTIVE", saved.getStatus());
        assertEquals("newcustomer@example.com", saved.getEmail());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("BL-023: Trùng username không phân biệt hoa thường -> 409 Conflict")
    void testRegisterDuplicateUsernameThrows409() {
        RegisterRequest request = new RegisterRequest(
                "existingUser",
                "Pass123",
                "unique@example.com",
                null,
                null
        );
        when(userRepository.existsByUsernameIgnoreCase("existingUser")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Username đã tồn tại"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("BL-023: Trùng email không phân biệt hoa thường -> 409 Conflict")
    void testRegisterDuplicateEmailThrows409() {
        RegisterRequest request = new RegisterRequest(
                "newUser",
                "Pass123",
                "Existing@example.com",
                null,
                null
        );
        when(userRepository.existsByUsernameIgnoreCase("newUser")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Email đã được sử dụng"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("BL-023: Mật khẩu quá 72 byte UTF-8 -> 400 Bad Request")
    void testRegisterPasswordOver72BytesThrows400() {
        String longPass = "a".repeat(73);
        RegisterRequest request = new RegisterRequest(
                "validUser",
                longPass,
                "valid@example.com",
                null,
                null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("72 byte"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("BL-023: Mật khẩu dưới 6 ký tự -> 400 Bad Request")
    void testRegisterPasswordUnder6CharsThrows400() {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "12345",
                "valid@example.com",
                null,
                null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("6 ký tự"));
    }

    @Test
    @DisplayName("BL-023: Email sai định dạng -> 400 Bad Request")
    void testRegisterInvalidEmailThrows400() {
        RegisterRequest request = new RegisterRequest(
                "validUser",
                "ValidPass123",
                "invalid-email-format",
                null,
                null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("định dạng"));
    }

    @Test
    @DisplayName("BL-023: Username chứa khoảng trắng hoặc ký tự đặc biệt -> 400 Bad Request")
    void testRegisterInvalidUsernameThrows400() {
        RegisterRequest request = new RegisterRequest(
                "user name with spaces",
                "ValidPass123",
                "valid@example.com",
                null,
                null
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    @DisplayName("BL-023: Bắt DataIntegrityViolationException khi race condition -> 409 Conflict")
    void testRegisterDataIntegrityViolationThrows409() {
        RegisterRequest request = new RegisterRequest(
                "raceUser",
                "ValidPass123",
                "race@example.com",
                null,
                null
        );
        Role customerRole = new Role();
        customerRole.setName("CUSTOMER");

        when(userRepository.existsByUsernameIgnoreCase("raceUser")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("race@example.com")).thenReturn(false);
        when(roleRepository.findByNameIgnoreCase("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(any())).thenReturn("$2a$10$hash");
        when(userRepository.save(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("Unique constraint violation"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authenticationService.register(request));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("đã tồn tại"));
    }
}

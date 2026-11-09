package vn.edu.fpt.sba301_clothing_shop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.LoginRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.AuthResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
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
}

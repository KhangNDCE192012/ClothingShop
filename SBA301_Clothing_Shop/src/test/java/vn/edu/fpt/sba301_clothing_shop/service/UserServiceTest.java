package vn.edu.fpt.sba301_clothing_shop.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.dto.request.UserUpdateRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Role;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.repository.RoleRepository;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, roleRepository);
    }

    @Test
    @DisplayName("BL-034: Cập nhật thông tin user thành công")
    void testUpdateUserSuccess() {
        Role customerRole = new Role();
        customerRole.setId(3);
        customerRole.setName("CUSTOMER");

        User existingUser = new User();
        existingUser.setId(1);
        existingUser.setUsername("customer1");
        existingUser.setEmail("old@example.com");
        existingUser.setFullName("Old Name");
        existingUser.setPhone("0911111111");
        existingUser.setStatus("ACTIVE");
        existingUser.setRole(customerRole);
        existingUser.setCreatedAt(LocalDateTime.now());

        UserUpdateRequest request = new UserUpdateRequest(
                "New Full Name",
                "newemail@example.com",
                "0988888888",
                "INACTIVE",
                "CUSTOMER"
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("newemail@example.com", 1)).thenReturn(false);
        when(roleRepository.findByNameIgnoreCase("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateUser(1, request);

        assertNotNull(response);
        assertEquals("New Full Name", response.fullName());
        assertEquals("newemail@example.com", response.email());
        assertEquals("0988888888", response.phone());
        assertEquals("INACTIVE", response.status());
        verify(userRepository).save(existingUser);
    }

    @Test
    @DisplayName("BL-034: Cập nhật email trùng với tài khoản khác -> 409 Conflict")
    void testUpdateUserDuplicateEmailThrows409() {
        User existingUser = new User();
        existingUser.setId(1);
        existingUser.setEmail("current@example.com");

        UserUpdateRequest request = new UserUpdateRequest(
                "Name",
                "taken@example.com",
                null,
                null,
                null
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("taken@example.com", 1)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(1, request));

        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Email đã được sử dụng"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("BL-034: Cập nhật email sai định dạng -> 400 Bad Request")
    void testUpdateUserInvalidEmailThrows400() {
        User existingUser = new User();
        existingUser.setId(1);

        UserUpdateRequest request = new UserUpdateRequest(
                "Name",
                "invalid-email",
                null,
                null,
                null
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existingUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(1, request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("định dạng"));
    }

    @Test
    @DisplayName("BL-034: Cập nhật số điện thoại sai định dạng -> 400 Bad Request")
    void testUpdateUserInvalidPhoneThrows400() {
        User existingUser = new User();
        existingUser.setId(1);

        UserUpdateRequest request = new UserUpdateRequest(
                "Name",
                null,
                "abc12345",
                null,
                null
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existingUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(1, request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Số điện thoại không hợp lệ"));
    }

    @Test
    @DisplayName("BL-034: Cập nhật trạng thái không hợp lệ -> 400 Bad Request")
    void testUpdateUserInvalidStatusThrows400() {
        User existingUser = new User();
        existingUser.setId(1);

        UserUpdateRequest request = new UserUpdateRequest(
                "Name",
                null,
                null,
                "UNKNOWN_STATUS",
                null
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(existingUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(1, request));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Trạng thái không hợp lệ"));
    }

    @Test
    @DisplayName("BL-034: User không tồn tại -> 404 Not Found")
    void testUpdateUserNotFoundThrows404() {
        UserUpdateRequest request = new UserUpdateRequest(
                "Name",
                null,
                null,
                null,
                null
        );

        when(userRepository.findById(999)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(999, request));

        assertEquals(404, ex.getStatusCode().value());
    }
}


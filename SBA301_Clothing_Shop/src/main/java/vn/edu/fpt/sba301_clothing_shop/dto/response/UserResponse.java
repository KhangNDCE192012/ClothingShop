package vn.edu.fpt.sba301_clothing_shop.dto.response;

import vn.edu.fpt.sba301_clothing_shop.entity.User;

import java.time.LocalDateTime;

public record UserResponse(
        Integer id,
        String username,
        String email,
        String fullName,
        String phone,
        String role,
        String status,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().getName(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}

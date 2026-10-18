package vn.edu.fpt.sba301_clothing_shop.dto.response;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        Integer userId,
        String username,
        String fullName,
        String role
) {
}

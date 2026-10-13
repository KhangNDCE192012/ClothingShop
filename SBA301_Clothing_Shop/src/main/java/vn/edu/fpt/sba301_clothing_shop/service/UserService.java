package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getCustomers() {
        return userRepository
                .findAllByRoleNameIgnoreCaseOrderByCreatedAtDesc(CUSTOMER_ROLE)
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}

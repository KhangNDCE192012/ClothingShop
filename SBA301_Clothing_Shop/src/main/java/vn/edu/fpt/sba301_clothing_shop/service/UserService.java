package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.dto.response.UserResponse;
import vn.edu.fpt.sba301_clothing_shop.repository.UserRepository;

import java.util.List;

@Service
public class UserService {

    private static final String CUSTOMER_ROLE = "CUSTOMER";
    private static final String BLOCKED_STATUS = "BANNED";

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

    @Transactional
    public UserResponse lockCustomer(Integer id) {
        User customer = findCustomer(id);
        customer.setStatus(BLOCKED_STATUS);
        return UserResponse.from(userRepository.save(customer));
    }

    @Transactional
    public void deleteCustomer(Integer id) {
        User customer = findCustomer(id);

        if (userRepository.countOrdersByUserId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa khách hàng đã có đơn hàng"
            );
        }

        userRepository.deleteCartsByUserId(id);
        userRepository.delete(customer);
    }

    private User findCustomer(Integer id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID phải lớn hơn 0");
        }

        return userRepository.findByIdAndRoleNameIgnoreCase(id, CUSTOMER_ROLE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản customer với ID: " + id
                ));
    }
}

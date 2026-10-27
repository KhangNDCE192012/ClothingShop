package vn.edu.fpt.sba301_clothing_shop.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vn.edu.fpt.sba301_clothing_shop.dto.request.CheckoutRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.request.OrderStatusRequest;
import vn.edu.fpt.sba301_clothing_shop.dto.response.CheckoutResponse;
import vn.edu.fpt.sba301_clothing_shop.entity.Order;
import vn.edu.fpt.sba301_clothing_shop.entity.OrderDetail;
import vn.edu.fpt.sba301_clothing_shop.entity.User;
import vn.edu.fpt.sba301_clothing_shop.entity.Variant;
import vn.edu.fpt.sba301_clothing_shop.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final VariantRepository variantRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    public OrderService(
            OrderRepository orderRepository,
            OrderDetailRepository orderDetailRepository,
            VariantRepository variantRepository,
            UserRepository userRepository,
            CartRepository cartRepository) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
    }


    @Transactional
    public CheckoutResponse checkout(
            String username,
            CheckoutRequest request) {

        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new RuntimeException("Không tìm thấy người dùng")
        );

        Integer userId = user.getId();



        if (!"COD".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new IllegalArgumentException(
                    "Chỉ hỗ trợ thanh toán khi nhận hàng (COD).");
        }

        if (request.getItems() == null
                || request.getItems().isEmpty()) {
            throw new IllegalArgumentException(
                    "Giỏ hàng không có sản phẩm.");
        }

        if (request.getShippingAddress() == null
                || request.getShippingAddress().isBlank()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập địa chỉ giao hàng.");
        }

        // Không cho một variant xuất hiện nhiều lần trong request.
        Set<Integer> variantIds = new HashSet<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        // Tính lại tiền theo giá trong database.
        for (CheckoutRequest.CheckoutItemRequest item
                : request.getItems()) {

            if (item.getVariantId() == null
                    || item.getQuantity() == null
                    || item.getQuantity() <= 0) {
                throw new IllegalArgumentException(
                        "Variant hoặc số lượng không hợp lệ.");
            }

            if (!variantIds.add(item.getVariantId())) {
                throw new IllegalArgumentException(
                        "Một variant không được xuất hiện nhiều lần.");
            }

            Variant variant = variantRepository
                    .findById(item.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy variant ID: "
                                    + item.getVariantId()));

            BigDecimal price = variant.getPrice();

            if (price == null || price.signum() < 0) {
                throw new IllegalArgumentException(
                        "Giá sản phẩm không hợp lệ.");
            }

            subtotal = subtotal.add(
                    price.multiply(
                            BigDecimal.valueOf(item.getQuantity())));
        }

        // Phí vận chuyển mẫu: miễn phí từ 1 triệu đồng.
        BigDecimal shippingFee =
                subtotal.compareTo(new BigDecimal("1000000")) >= 0
                        ? BigDecimal.ZERO
                        : new BigDecimal("30000");

        BigDecimal total = subtotal.add(shippingFee);

        // Tạo Order.
        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalPrice(total);
        order.setStatus("PENDING");

        order.setRecipientName(user.getFullName());
        order.setRecipientPhone(user.getPhone());
        order.setRecipientEmail(user.getEmail());
        order.setShippingAddress(
                request.getShippingAddress().trim());
        order.setShippingFee(shippingFee);
        order.setPaymentMethod("COD");
        order.setNote(request.getNote());

        Order savedOrder = orderRepository.save(order);

        // Tạo OrderDetail theo giá lấy từ database.
        for (CheckoutRequest.CheckoutItemRequest item
                : request.getItems()) {

            Variant variant = variantRepository
                    .findById(item.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy variant ID: "
                                    + item.getVariantId()));

            OrderDetail detail = new OrderDetail();
            detail.setOrder(savedOrder);
            detail.setVariant(variant);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(variant.getPrice());

            orderDetailRepository.save(detail);
        }

        // Chỉ xóa những sản phẩm đã được đặt hàng thành công.
        List<Integer> orderedVariantIds = request.getItems()
                .stream()
                .map(CheckoutRequest.CheckoutItemRequest::getVariantId)
                .toList();

        cartRepository.deleteOrderedItems(userId, orderedVariantIds);

        return new CheckoutResponse(
                savedOrder.getId(),
                savedOrder.getStatus(),
                "COD",
                total,
                shippingFee,
                savedOrder.getOrderDate(),
                "Đặt hàng thành công."
        );
    }


    public List<Order> getAllOrder() {
        return orderRepository.findAll()
                .stream()
                .filter(order ->
                        !"DELETED".equalsIgnoreCase(order.getStatus()))
                .toList();
    }


    public List<OrderDetail> getOrderById(Integer id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException(
                "Không tìm thấy Order ID: "
                        + id));
        if ("DELETED".equalsIgnoreCase(order.getStatus())) {
            throw new IllegalStateException(
                    "Đơn hàng đã bị xóa, không thể truy cập."
            );
        }
        return orderDetailRepository.findByOrder_Id(id);
    }

    public Order updateOrderStatus(Integer id, OrderStatusRequest orderStatusRequest) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException(
                "Không tìm thấy Order ID: "
                        + id));

        String currentStatus = order.getStatus();
        if ("DELETED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException(
                    "Đơn hàng đã bị xóa, không thể thao tác."
            );
        }

        if (orderStatusRequest == null
                || orderStatusRequest.getStatus() == null
                || orderStatusRequest.getStatus().isBlank()) {
            throw new IllegalArgumentException(
                    "Trạng thái không được để trống."
            );
        }
        String status = orderStatusRequest.getStatus().trim().toUpperCase();
        Set<String> allowedStatuses = Set.of(
                "PENDING",
                "CONFIRMED",
                "SHIPPING",
                "COMPLETED",
                "CANCELLED",
                "DELETED"
        );
        if (!allowedStatuses.contains(status)) {
            throw new IllegalArgumentException(
                    "Trạng thái đơn hàng không hợp lệ."
            );
        }
        order.setStatus(status);
        return orderRepository.save(order);
    }
}

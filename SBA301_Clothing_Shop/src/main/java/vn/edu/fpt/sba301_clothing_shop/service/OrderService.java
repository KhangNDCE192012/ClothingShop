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

/**
 * Service xử lý các nghiệp vụ Đơn hàng (Order Service).
 * Bao gồm: đặt hàng (checkout COD), xem danh sách đơn hàng cho Admin, xem chi tiết và cập nhật trạng thái đơn hàng.
 */
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

    /**
     * BL-017: Thực hiện quy trình đặt hàng và thanh toán COD.
     * Kiểm tra hợp lệ dữ liệu, tính toán tiền theo giá DB, tạo Order và OrderDetail,
     * đồng thời tự động xóa các sản phẩm đã đặt khỏi giỏ hàng.
     *
     * @param username Tên đăng nhập của người đặt
     * @param request DTO chứa địa chỉ, phương thức thanh toán và danh sách sản phẩm
     * @return CheckoutResponse thông tin đơn hàng vừa đặt thành công
     */
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

        // Tính lại tiền theo giá trong database để chống gian lận giá từ client.
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
                        "Giá của variant không hợp lệ.");
            }

            BigDecimal itemTotal = price.multiply(
                    BigDecimal.valueOf(item.getQuantity())
            );

            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal shippingFee = BigDecimal.valueOf(30000);
        BigDecimal total = subtotal.add(shippingFee);

        Order order = new Order();
        order.setUser(user);
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setShippingAddress(request.getShippingAddress());
        order.setOrderDate(LocalDateTime.now());
        order.setTotal(total);
        order.setStatus("PENDING");

        Order savedOrder = orderRepository.save(order);

        for (CheckoutRequest.CheckoutItemRequest item
                : request.getItems()) {

            Variant variant = variantRepository
                    .findById(item.getVariantId())
                    .orElseThrow();

            OrderDetail detail = new OrderDetail();
            detail.setOrder(savedOrder);
            detail.setVariant(variant);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(variant.getPrice());

            orderDetailRepository.save(detail);
        }

        // Chỉ xóa những sản phẩm đã được đặt hàng thành công khỏi giỏ hàng.
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

    /**
     * BL-019: Lấy toàn bộ đơn hàng trong hệ thống (loại trừ các đơn có trạng thái DELETED).
     *
     * @return Danh sách Order
     */
    public List<Order> getAllOrder() {
        return orderRepository.findAll()
                .stream()
                .filter(order ->
                        !"DELETED".equalsIgnoreCase(order.getStatus()))
                .toList();
    }

    /**
     * BL-020: Lấy chi tiết các sản phẩm thuộc một đơn hàng theo order ID.
     *
     * @param id Mã định danh đơn hàng
     * @return Danh sách chi tiết đơn hàng List<OrderDetail>
     */
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

    /**
     * BL-021: Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED, DELETED).
     *
     * @param id Mã định danh đơn hàng
     * @param orderStatusRequest DTO chứa trạng thái mới
     * @return Order sau khi cập nhật
     */
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

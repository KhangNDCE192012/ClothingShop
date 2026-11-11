/**
 * Service quản lý các yêu cầu HTTP liên quan đến Đơn hàng (Order).
 * Hỗ trợ tạo đơn hàng khi thanh toán (Checkout) và quản lý danh sách đơn hàng cho Admin.
 */
import {getAccessToken} from "./AuthService.jsx";

const ORDER_API =
    "http://localhost:8080/api/orders";

/**
 * Gửi yêu cầu đặt hàng (Checkout) tạo đơn hàng mới từ giỏ hàng hoặc thông tin thanh toán.
 *
 * @param {Object} payload - Dữ liệu thông tin giao hàng và chi tiết đơn hàng
 * @returns {Promise<Object>} Dữ liệu đơn hàng vừa được tạo thành công
 * @throws {Error} Nếu tạo đơn thất bại hoặc backend báo lỗi
 */
export async function createOrder(payload) {
    const token = getAccessToken();

    const response = await fetch(
        `${ORDER_API}/checkout`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Không thể tạo đơn hàng."
        );
    }

    return data;
}

/**
 * Cập nhật trạng thái đơn hàng (Dành cho Admin: PENDING, COMPLETED, CANCELLED, DELETED).
 *
 * @param {number} id - Mã đơn hàng cần cập nhật
 * @param {string} status - Trạng thái mới của đơn hàng
 * @returns {Promise<Object>} Đơn hàng sau khi đã đổi trạng thái
 * @throws {Error} Nếu chưa đăng nhập hoặc không tìm thấy đơn hàng
 */
export async function updateOrderStatus(id, status) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Vui lòng đăng nhập lại.");
    }

    const response = await fetch(
        `${ORDER_API}/manage/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Không tìm thấy đơn hàng"
        );
    }

    return data;
}

/**
 * Lấy danh sách toàn bộ các đơn hàng trong hệ thống (Dành cho Admin).
 *
 * @returns {Promise<Array>} Danh sách các đối tượng đơn hàng
 * @throws {Error} Nếu chưa đăng nhập, không có quyền truy cập hoặc có lỗi hệ thống
 */
export async function getAllOrders() {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${ORDER_API}/manage`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Bạn không có quyền xem danh sách đơn hàng.");
        }

        throw new Error(
            `Không thể tải danh sách đơn hàng (HTTP ${response.status}).`
        );
    }

    const data = await response.json();

    return Array.isArray(data)
        ? data
        : data?.orders ?? data?.content ?? data?.data ?? [];
}

/**
 * Lấy thông tin chi tiết của một đơn hàng theo ID (Dành cho Admin).
 *
 * @param {number} id - Mã đơn hàng
 * @returns {Promise<Object>} Thông tin chi tiết đơn hàng
 * @throws {Error} Nếu đơn hàng không tồn tại
 */
export async function getOrderById(id) {
    const token = getAccessToken();

    const response = await fetch(
        `${ORDER_API}/manage/${id}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },

        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Không tìm thấy đơn hàng"
        );
    }

    return Array.isArray(data)
        ? data
        : data?.orders ?? data?.content ?? data?.data ?? [];
}

/**
 * Xóa một đơn hàng bằng cách chuyển trạng thái sang DELETED (Soft delete).
 *
 * @param {number} id - Mã đơn hàng
 * @returns {Promise<Object>} Kết quả sau khi xóa
 */
export async function deleteOrder(id) {
    return updateOrderStatus(id, "DELETED");
}

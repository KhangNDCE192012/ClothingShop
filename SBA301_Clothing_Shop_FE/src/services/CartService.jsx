
/**
 * Service quản lý các yêu cầu HTTP liên quan đến Giỏ hàng (Cart) của người dùng.
 * Cung cấp các hàm thêm biến thể sản phẩm vào giỏ, xem giỏ hàng và cập nhật số lượng.
 */
import { getAccessToken } from "./AuthService";

const API_URL = "http://localhost:8080/api/carts";

/**
 * Thêm một sản phẩm (biến thể) với số lượng chỉ định vào giỏ hàng của tài khoản đang đăng nhập.
 *
 * @param {number} variantId - ID của biến thể sản phẩm
 * @param {number} quantity - Số lượng cần thêm
 * @returns {Promise<Object>} Dữ liệu giỏ hàng sau khi thêm
 * @throws {Error} Nếu chưa đăng nhập hoặc backend trả về mã lỗi
 */
export async function addToCart(variantId, quantity) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            variantId,
            quantity,
        }),
    });

    // Đọc response body đúng một lần
    const text = await response.text();

    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    console.log("Cart response:", response.status, data);

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.message || data.error
                : data;

        throw new Error(
            message || "Không thể thêm sản phẩm vào giỏ hàng."
        );
    }

    return data;
}

/**
 * Lấy danh sách các sản phẩm và tổng tiền trong giỏ hàng của người dùng hiện tại.
 *
 * @returns {Promise<Object>} Thông tin chi tiết giỏ hàng của người dùng
 * @throws {Error} Nếu chưa đăng nhập hoặc gặp lỗi tải dữ liệu
 */
export async function getMyCart() {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Vui lòng đăng nhập để xem giỏ hàng.");
    }

    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Không thể tải giỏ hàng.");
    }

    return response.json();
}

/**
 * Cập nhật số lượng mới của biến thể sản phẩm trong giỏ hàng.
 *
 * @param {number} variantId - ID biến thể sản phẩm
 * @param {number} quantity - Số lượng mới
 * @returns {Promise<Object>} Giỏ hàng sau khi cập nhật
 * @throws {Error} Nếu yêu cầu cập nhật thất bại
 */
export async function updateCartQuantity(variantId, quantity) {
    const token = getAccessToken();

    const response = await fetch(
        API_URL,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                variantId,
                quantity,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Không thể cập nhật số lượng sản phẩm.");
    }

    return response.json();
}

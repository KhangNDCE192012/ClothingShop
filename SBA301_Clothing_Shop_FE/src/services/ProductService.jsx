import {getAccessToken} from "./AuthService";

/*
 * Nguyen Duy Khang - CE192012
 * Gọi các API sản phẩm; BL-006 dùng getProducts để ADMIN tải danh sách quản lý.
 */
const API_URL = "http://localhost:8080/api/products";

/**
 * Gọi GET /api/products kèm JWT vì backend chỉ cho phép ADMIN truy cập.
 */
export async function getProducts() {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(API_URL, {
        headers: {Authorization: `Bearer ${token}`},
    });

    if (!response.ok) {
        let message = "Không thể tải danh sách sản phẩm";

        try {
            const body = await response.json();
            message = body.message || body.detail || message;
        } catch {
            // Giữ thông báo mặc định nếu response không phải JSON.
        }

        throw new Error(`${message} (HTTP ${response.status})`);
    }

    return response.json();
}

export async function getVariants(productId) {
    const response = await fetch(`${API_URL}/${productId}`);

    if (!response.ok) {
        throw new Error(`Không thể tải sản phẩm: HTTP ${response.status}`);
    }

    return response.json();
}

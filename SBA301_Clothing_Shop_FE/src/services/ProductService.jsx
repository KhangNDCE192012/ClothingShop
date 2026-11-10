import {getAccessToken} from "./AuthService";

/*
 * Nguyen Duy Khang - CE192012
 * Gọi API sản phẩm cho Home BL-003, điều hướng BL-005 và quản lý BL-006.
 */
const API_URL = "http://localhost:8080/api/products";

/**
 * Gọi GET /api/products. Token là tùy chọn vì Home được truy cập công khai.
 */
export async function getProducts() {
    const token = getAccessToken();

    const response = await fetch(API_URL, {
        headers: token ? {Authorization: `Bearer ${token}`} : {},
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

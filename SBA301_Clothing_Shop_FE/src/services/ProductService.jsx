import {getAccessToken} from "./AuthService";

/*
 * Nguyen Duy Khang
 * Gọi API sản phẩm cho các chức năng đọc và tạo sản phẩm.
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

/** BL-007: gửi Product mới kèm JWT của ADMIN. */
export async function createProduct(payload) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let message = "Không thể tạo sản phẩm";

        try {
            const body = await response.json();
            message = body.message || body.detail || message;
        } catch {
            // Giữ thông báo mặc định nếu backend không trả JSON.
        }

        throw new Error(`${message} (HTTP ${response.status})`);
    }

    return response.json();
}

/** Gọi BL-011 và trả về object Product đầy đủ theo ID. */
export async function getProductById(productId) {
    const response = await fetch(`${API_URL}/${productId}`);

    if (!response.ok) {
        throw new Error(`Không thể tải sản phẩm: HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Adapter giữ tương thích với trang ProductDetail hiện có sau khi BL-011 đổi response.
 */
export async function getVariants(productId) {
    const product = await getProductById(productId);
    return Array.isArray(product?.variants) ? product.variants : [];
}

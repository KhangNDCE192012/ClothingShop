import {getAccessToken} from "./AuthService";

/*
 * Nguyen Duy Khang
 * Gọi API đọc, tạo, sửa và xóa sản phẩm cho Product Management/Home.
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

/** Gửi dữ liệu Product kèm JWT và xử lý lỗi chung cho BL-007/BL-008. */
async function saveProduct(method, url, payload, fallbackMessage) {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let message = fallbackMessage;

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

/** BL-007: tạo Product mới. */
export function createProduct(payload) {
    return saveProduct("POST", API_URL, payload, "Không thể tạo sản phẩm");
}

/** BL-008: cập nhật Product đã tồn tại theo ID. */
export function updateProduct(productId, payload) {
    return saveProduct(
        "PUT",
        `${API_URL}/${productId}`,
        payload,
        "Không thể cập nhật sản phẩm"
    );
}

/** BL-009: gửi JWT để xóa sản phẩm theo ID; HTTP 204 không có body. */
export async function deleteProduct(productId) {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");

    const response = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
        headers: {Authorization: `Bearer ${token}`},
    });
    if (!response.ok) {
        let message = "Không thể xóa sản phẩm";
        try {
            const body = await response.json();
            message = body.message || body.detail || message;
        } catch {
            // Giữ thông báo mặc định khi backend không trả JSON.
        }
        throw new Error(`${message} (HTTP ${response.status})`);
    }
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

import {getAccessToken} from "./AuthService";

const API_URL = "http://localhost:8080/api/users";

function authHeaders() {
    const token = getAccessToken();
    return token ? {Authorization: `Bearer ${token}`} : {};
}

async function throwResponseError(response, fallbackMessage) {
    let message = fallbackMessage;

    try {
        const body = await response.json();
        message = body.detail || body.message || message;
    } catch {
        // Response không có JSON body, dùng thông báo mặc định.
    }

    throw new Error(`${message} (HTTP ${response.status})`);
}

export async function getCustomers() {
    const response = await fetch(API_URL, {headers: authHeaders()});

    if (!response.ok) {
        await throwResponseError(response, "Không thể tải danh sách khách hàng");
    }

    return response.json();
}

export async function lockCustomer(userId) {
    const response = await fetch(`${API_URL}/${userId}/lock`, {
        method: "PATCH",
        headers: authHeaders(),
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể khóa tài khoản");
    }

    return response.json();
}

export async function deleteCustomer(userId) {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể xóa tài khoản");
    }
}


/** Lấy thông tin tài khoản đang đăng nhập. */
export async function getCurrentUser() {
    const token = getAccessToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        await throwResponseError(
            response,
            "Không thể tải hồ sơ người dùng"
        );
    }

    return response.json();
}


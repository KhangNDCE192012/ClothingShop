const API_URL = "http://localhost:8080/api/users";

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
    const response = await fetch(API_URL);

    if (!response.ok) {
        await throwResponseError(response, "Không thể tải danh sách khách hàng");
    }

    return response.json();
}

export async function lockCustomer(userId) {
    const response = await fetch(`${API_URL}/${userId}/lock`, {
        method: "PATCH",
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể khóa tài khoản");
    }

    return response.json();
}

export async function deleteCustomer(userId) {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể xóa tài khoản");
    }
}

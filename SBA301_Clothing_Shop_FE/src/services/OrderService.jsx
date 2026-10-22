import {getAccessToken} from "./AuthService.jsx";

const ORDER_API =
    "http://localhost:8080/api/orders";
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

export async function deleteOrder(id) {
    return updateOrderStatus(id, "DELETED");
}

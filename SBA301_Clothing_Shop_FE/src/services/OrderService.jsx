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



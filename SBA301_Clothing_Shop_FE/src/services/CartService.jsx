
import { getAccessToken } from "./AuthService";

const API_URL = "http://localhost:8080/api/carts";

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

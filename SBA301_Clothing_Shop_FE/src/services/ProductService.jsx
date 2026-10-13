
const API_URL = "http://localhost:8080/api/products";

export async function getVariants(productId) {
    const response = await fetch(`${API_URL}/${productId}`);

    if (!response.ok) {
        throw new Error(`Không thể tải sản phẩm: HTTP ${response.status}`);
    }

    return response.json();
}

const API_URL = "http://localhost:8080/api/users";

export async function getCustomers() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`Không thể tải danh sách khách hàng: HTTP ${response.status}`);
    }

    return response.json();
}

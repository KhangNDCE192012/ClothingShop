import {getAccessToken} from "./AuthService";

const API_URL = "http://localhost:8080/api/users";

/**
 * Trả về header Authorization chứa Bearer token nếu người dùng đã đăng nhập.
 */
function authHeaders() {
    const token = getAccessToken();
    return token ? {Authorization: `Bearer ${token}`} : {};
}

/**
 * Xử lý và ném lỗi từ phản hồi của API backend dạng tiếng Việt.
 */
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

/**
 * BL-031: Lấy danh sách toàn bộ khách hàng dành cho Admin.
 * Endpoint: GET /api/users
 * Yêu cầu quyền: ADMIN
 *
 * @returns {Promise<Array>} Danh sách các khách hàng dạng UserResponse
 */
export async function getCustomers() {
    const response = await fetch(API_URL, {headers: authHeaders()});

    if (!response.ok) {
        await throwResponseError(response, "Không thể tải danh sách khách hàng");
    }

    return response.json();
}

/**
 * BL-034: Lấy thông tin chi tiết một tài khoản người dùng theo ID.
 * Endpoint: GET /api/users/{userId}
 * Yêu cầu quyền: ADMIN
 *
 * @param {number|string} userId Mã định danh người dùng
 * @returns {Promise<Object>} Thông tin chi tiết tài khoản
 */
export async function getCustomerById(userId) {
    const response = await fetch(`${API_URL}/${userId}`, {
        headers: authHeaders(),
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể lấy thông tin tài khoản");
    }

    return response.json();
}

/**
 * BL-034: Cập nhật thông tin tài khoản người dùng (Admin).
 * Endpoint: PUT /api/users/{userId}
 * Yêu cầu quyền: ADMIN
 *
 * @param {number|string} userId Mã định danh người dùng cần cập nhật
 * @param {Object} payload Dữ liệu cập nhật { fullName, email, phone, status, role }
 * @returns {Promise<Object>} Thông tin tài khoản sau khi lưu
 */
export async function updateCustomer(userId, payload) {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể cập nhật thông tin tài khoản");
    }

    return response.json();
}

/**
 * BL-032: Khóa tài khoản khách hàng (chuyển status thành BANNED).
 * Endpoint: PATCH /api/users/{userId}/lock
 * Yêu cầu quyền: ADMIN
 *
 * @param {number|string} userId Mã định danh khách hàng cần khóa
 * @returns {Promise<Object>} Thông tin khách hàng với status mới
 */
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

/**
 * BL-033: Xóa vĩnh viễn tài khoản khách hàng.
 * Endpoint: DELETE /api/users/{userId}
 * Yêu cầu quyền: ADMIN
 *
 * @param {number|string} userId Mã định danh khách hàng cần xóa
 */
export async function deleteCustomer(userId) {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });

    if (!response.ok) {
        await throwResponseError(response, "Không thể xóa tài khoản");
    }
}

/**
 * Lấy thông tin tài khoản của người dùng đang đăng nhập hiện tại từ JWT token.
 * Endpoint: GET /api/users/me
 *
 * @returns {Promise<Object>} Hồ sơ người dùng
 */
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

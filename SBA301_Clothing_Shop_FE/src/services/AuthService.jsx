/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Service quản lý xác thực người dùng phía Frontend (Authentication Service).
 * Bao gồm các chức năng:
 * - BL-024: Đăng nhập (login)
 * - BL-025: Quản lý và trích xuất JWT Token
 * - BL-023: Đăng ký tài khoản mới (register)
 * - BL-026: Đăng xuất và dọn dẹp phiên (logout)
 */

const AUTH_API_URL = "http://localhost:8080/api/auth";
const AUTH_STORAGE_KEY = "clothingShopAuth";

/**
 * Đọc thông báo lỗi chi tiết từ phản hồi của API backend.
 */
async function readError(response, fallbackMessage) {
    try {
        const body = await response.json();
        return body.detail || body.message || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

/**
 * BL-024 & BL-025: Gửi thông tin đăng nhập lên server và lưu phiên làm việc.
 * Endpoint: POST /api/auth/login
 *
 * @param {string} username Tên đăng nhập
 * @param {string} password Mật khẩu
 * @returns {Promise<Object>} Đối tượng session chứa token và thông tin người dùng
 */
export async function login(username, password) {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
    });

    if (!response.ok) {
        throw new Error(await readError(response, "Đăng nhập không thành công"));
    }

    const result = await response.json();
    // BL-025: Đóng gói session kèm thời hạn hết hạn tính theo mili-giây
    const session = {
        token: result.token,
        tokenType: result.tokenType || "Bearer",
        expiresAt: Date.now() + Number(result.expiresIn || 0) * 1000,
        user: {
            id: result.userId,
            username: result.username,
            fullName: result.fullName,
            role: result.role,
        },
    };

    // Lưu phiên vào localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return session;
}

/**
 * BL-023: Gửi thông tin đăng ký tài khoản khách hàng mới lên server.
 * Endpoint: POST /api/auth/register
 *
 * @param {Object} payload Dữ liệu đăng ký: { username, password, email, fullName, phone }
 * @returns {Promise<Object>} Thông tin tài khoản UserResponse vừa tạo
 */
export async function register(payload) {
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readError(response, "Đăng ký không thành công"));
    }

    return await response.json();
}

/**
 * BL-025: Lấy thông tin phiên đăng nhập hiện tại từ localStorage.
 * Tự động đăng xuất nếu phiên đã hết hạn.
 *
 * @returns {Object|null} Thông tin session hoặc null nếu chưa đăng nhập / hết hạn
 */
export function getSession() {
    try {
        const value = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!value) return null;

        const session = JSON.parse(value);
        // Kiểm tra xem token đã hết hạn chưa
        if (!session.token || !session.user || session.expiresAt <= Date.now()) {
            logout();
            return null;
        }

        return session;
    } catch {
        logout();
        return null;
    }
}

/**
 * BL-025: Trích xuất Access Token (JWT) hiện tại để đính kèm vào Header request.
 *
 * @returns {string|null} Chuỗi token hoặc null
 */
export function getAccessToken() {
    return getSession()?.token || null;
}

/**
 * BL-026: Đăng xuất tài khoản - Xóa toàn bộ dữ liệu phiên trong localStorage.
 */
export function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

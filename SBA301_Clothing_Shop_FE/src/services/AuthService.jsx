/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Service quản lý xác thực người dùng phía Frontend (Authentication Service).
 * Bao gồm các chức năng:
 * - BL-024: Đăng nhập (login)
 * - BL-025: Quản lý và trích xuất JWT Token
 * - BL-023: Đăng ký tài khoản mới (register)
 * - BL-026: Đăng xuất và dọn dẹp phiên (logout)
 */

// Địa chỉ URL gốc của các API xác thực trên backend Spring Boot
const AUTH_API_URL = "http://localhost:8080/api/auth";

// Khóa (key) định danh dùng để lưu thông tin phiên đăng nhập trong LocalStorage của trình duyệt
const AUTH_STORAGE_KEY = "clothingShopAuth";

/**
 * Hàm tiện ích hỗ trợ đọc thông báo lỗi chi tiết từ phản hồi HTTP của server.
 * Trích xuất thuộc tính .detail hoặc .message từ JSON phản hồi.
 *
 * @param {Response} response Đối tượng Response từ hàm fetch
 * @param {string} fallbackMessage Thông báo dự phòng nếu server không trả về JSON
 * @returns {Promise<string>} Nội dung thông báo lỗi
 */
async function readError(response, fallbackMessage) {
    try {
        // Cố gắng chuyển đổi nội dung phản hồi từ server sang dạng JSON
        const body = await response.json();
        // Trả về trường detail hoặc message, nếu không có thì trả về thông báo dự phòng
        return body.detail || body.message || fallbackMessage;
    } catch {
        // Trường hợp server phản hồi dạng chuỗi thuần hoặc không có body, trả về thông báo mặc định
        return fallbackMessage;
    }
}

/**
 * BL-024 & BL-025: Gửi thông tin đăng nhập lên server và lưu phiên làm việc.
 * Endpoint: POST /api/auth/login
 *
 * @param {string} username Tên đăng nhập người dùng nhập
 * @param {string} password Mật khẩu thô người dùng nhập
 * @returns {Promise<Object>} Đối tượng session chứa token và thông tin người dùng
 */
export async function login(username, password) {
    // 1. Gửi request POST tới endpoint /api/auth/login kèm header JSON và body chứa username/password
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST", // Phương thức HTTP POST
        headers: {"Content-Type": "application/json"}, // Báo cho server biết định dạng dữ liệu là JSON
        body: JSON.stringify({username, password}), // Chuyển đổi đối tượng dữ liệu thành chuỗi JSON
    });

    // 2. Kiểm tra nếu mã trạng thái HTTP không thành công (!response.ok, ví dụ 401 Unauthorized)
    if (!response.ok) {
        // Đọc thông báo lỗi từ backend và ném ngoại lệ Error để Component (Login.jsx) bắt được
        throw new Error(await readError(response, "Đăng nhập không thành công"));
    }

    // 3. Phân tích kết quả JSON trả về từ backend (chứa token, tokenType, expiresIn, userId, username, role)
    const result = await response.json();

    // 4. BL-025: Đóng gói đối tượng session hoàn chỉnh, tính mốc thời gian hết hạn (mili-giây)
    const session = {
        token: result.token, // Chuỗi JWT Token do server cấp phát
        tokenType: result.tokenType || "Bearer", // Loại token (thông thường là Bearer)
        expiresAt: Date.now() + Number(result.expiresIn || 0) * 1000, // Thời điểm hết hạn (thời gian hiện tại + số giây * 1000)
        user: {
            id: result.userId, // Mã định danh ID của người dùng
            username: result.username, // Tên đăng nhập
            fullName: result.fullName, // Họ và tên đầy đủ
            role: result.role, // Quyền hạn (vai trò: ADMIN hoặc CUSTOMER)
        },
    };

    // 5. Lưu đối tượng session đã chuẩn hóa vào localStorage của trình duyệt dưới dạng chuỗi JSON
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    // 6. Trả về đối tượng session cho AuthContext hoặc hàm gọi sử dụng
    return session;
}

/**
 * BL-023: Gửi thông tin đăng ký tài khoản khách hàng mới lên server.
 * Endpoint: POST /api/auth/register
 *
 * @param {Object} payload Dữ liệu đăng ký: { username, password, email, fullName, phone }
 * @returns {Promise<Object>} Thông tin tài khoản UserResponse vừa tạo thành công
 */
export async function register(payload) {
    // 1. Gửi request POST tới endpoint /api/auth/register
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST", // Phương thức HTTP POST
        headers: {"Content-Type": "application/json"}, // Báo định dạng gửi lên là JSON
        body: JSON.stringify(payload), // Chuyển đổi dữ liệu đăng ký thành chuỗi JSON
    });

    // 2. Kiểm tra nếu backend trả về mã lỗi (ví dụ 400 Bad Request do dữ liệu sai hoặc 409 Conflict do trùng lặp)
    if (!response.ok) {
        // Đọc thông báo lỗi từ server và ném ra Error
        throw new Error(await readError(response, "Đăng ký không thành công"));
    }

    // 3. Trả về kết quả JSON chứa thông tin tài khoản người dùng vừa đăng ký thành công
    return await response.json();
}

/**
 * BL-025: Lấy thông tin phiên đăng nhập hiện tại từ localStorage.
 * Tự động kiểm tra tính hợp lệ và thời hạn sống của Token, tự động xóa phiên nếu token đã hết hạn.
 *
 * @returns {Object|null} Thông tin session hoặc null nếu chưa đăng nhập / phiên đã hết hạn
 */
export function getSession() {
    try {
        // 1. Đọc dữ liệu từ localStorage theo khóa AUTH_STORAGE_KEY
        const value = localStorage.getItem(AUTH_STORAGE_KEY);
        // Nếu không tìm thấy dữ liệu (người dùng chưa đăng nhập), trả về null
        if (!value) return null;

        // 2. Giải mã chuỗi JSON thành đối tượng session trong JavaScript
        const session = JSON.parse(value);

        // 3. Kiểm tra xem session có đầy đủ token, user và còn hạn sử dụng hay không
        // Date.now() là timestamp hiện tại tính theo ms; nếu expiresAt <= Date.now() nghĩa là token đã quá hạn
        if (!session.token || !session.user || session.expiresAt <= Date.now()) {
            // Phiên đã hết hạn hoặc không hợp lệ -> xóa sạch phiên làm việc
            logout();
            return null;
        }

        // 4. Phiên làm việc hoàn toàn hợp lệ -> trả về đối tượng session
        return session;
    } catch {
        // Bắt lỗi khi parse JSON bị hỏng -> dọn dẹp localStorage và trả về null
        logout();
        return null;
    }
}

/**
 * BL-025: Trích xuất Access Token (JWT) hiện tại để đính kèm vào Header Authorization của các request gọi API backend.
 *
 * @returns {string|null} Chuỗi token hoặc null nếu chưa đăng nhập / phiên hết hạn
 */
export function getAccessToken() {
    // Gọi hàm getSession(), nếu tồn tại session thì lấy thuộc tính token, ngược lại trả về null
    return getSession()?.token || null;
}

/**
 * BL-026: Đăng xuất tài khoản - Xóa toàn bộ dữ liệu phiên đăng nhập trong localStorage của trình duyệt.
 */
export function logout() {
    // Xóa mục lưu trữ có khóa AUTH_STORAGE_KEY khỏi LocalStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

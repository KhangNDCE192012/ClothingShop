import {useMemo, useState} from "react";
import * as authService from "../services/AuthService";
import AuthContext from "./authContextStore";

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Provider quản lý trạng thái phiên đăng nhập người dùng toàn cục trong ứng dụng.
 * Quản lý các chức năng:
 * - BL-024: Đăng nhập (login)
 * - BL-025: Lưu trữ và cung cấp JWT token
 * - BL-026: Đăng xuất (logout)
 */
export function AuthProvider({children}) {
    // Khởi tạo state session từ localStorage nếu phiên còn hiệu lực
    const [session, setSession] = useState(() => authService.getSession());

    const value = useMemo(() => ({
        session,
        // Thông tin người dùng hiện tại (id, username, fullName, role)
        user: session?.user || null,
        // JWT Access Token hiện tại
        token: session?.token || null,

        /**
         * BL-024 & BL-025: Thực hiện đăng nhập và cập nhật state toàn ứng dụng.
         */
        async login(username, password) {
            const nextSession = await authService.login(username, password);
            setSession(nextSession);
            return nextSession;
        },

        /**
         * BL-026: Thực hiện đăng xuất, xóa token trong localStorage và xóa state.
         */
        logout() {
            authService.logout();
            setSession(null);
        },
    }), [session]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

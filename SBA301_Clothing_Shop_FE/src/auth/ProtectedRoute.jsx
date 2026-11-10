import {Navigate, useLocation} from "react-router-dom";
import useAuth from "./useAuth";

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * BL-028: Component bảo vệ định tuyến (Route Guard) dựa trên vai trò (Role-based Authorization).
 * - Nếu người dùng chưa đăng nhập: Chuyển hướng ra /login kèm vị trí trang trước đó.
 * - Nếu người dùng không có vai trò hợp lệ (ví dụ CUSTOMER cố vào trang /admin): Chuyển hướng về trang chủ /.
 * - Nếu thỏa mãn điều kiện: Cho phép render component con.
 */
export default function ProtectedRoute({children, allowedRoles = []}) {
    const {user} = useAuth();
    const location = useLocation();

    // Trường hợp 1: Chưa đăng nhập -> chuyển hướng về /login
    if (!user) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />;
    }

    // Trường hợp 2: Đã đăng nhập nhưng không đủ quyền hạn vai trò -> chuyển về trang chủ /
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // Trường hợp 3: Hợp lệ -> cho phép hiển thị
    return children;
}

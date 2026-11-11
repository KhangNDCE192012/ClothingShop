
/**
 * Component Header chung của ứng dụng (Navigation Header).
 * Hiển thị logo, các liên kết điều hướng theo vai trò (ADMIN xem quản trị, CUSTOMER xem giỏ hàng),
 * tên tài khoản đăng nhập và nút đăng xuất (BL-026, BL-028).
 */
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";
import { getMyCart } from "../services/CartService";
import "../css/AuthHeader.css";

export default function AuthHeader() {
    // Lấy thông tin user hiện tại và hàm logout từ AuthContext
    const { user, logout } = useAuth();
    // Hook điều hướng trang của react-router-dom
    const navigate = useNavigate();
    // State lưu tổng số mục sản phẩm đang có trong giỏ hàng
    const [cartCount, setCartCount] = useState(0);

    // Hàm gọi API lấy số lượng sản phẩm trong giỏ hàng
    const loadCart = useCallback(async () => {
        // Nếu người dùng chưa đăng nhập thì không cần tải giỏ hàng
        if (!user) {
            return null;
        }

        try {
            // Gọi API getMyCart() lấy giỏ hàng của user hiện tại
            const data = await getMyCart();

            // Chuẩn hóa danh sách sản phẩm thành mảng
            const items = Array.isArray(data)
                ? data
                : data?.items ?? [];

            // Trả về số lượng các mặt hàng trong giỏ
            return items.length;
        } catch (error) {
            // Ghi log lỗi nếu không thể nạp giỏ hàng
            console.error("Không thể tải giỏ hàng:", error);
            return null;
        }
    }, [user]);

    // Tải lại số lượng giỏ hàng khi người dùng đăng nhập hoặc khi có sự kiện 'cartUpdated'
    useEffect(() => {
        // Cờ kiểm soát tránh cập nhật state khi component đã unmount
        let cancelled = false;

        // Hàm làm mới giỏ hàng
        const refreshCart = async () => {
            // Nếu chưa đăng nhập thì bỏ qua
            if (!user) {
                return;
            }

            // Gọi hàm loadCart để lấy số lượng mới nhất
            const total = await loadCart();

            // Nếu component vẫn đang hiển thị và có dữ liệu thì cập nhật state
            if (!cancelled && total !== null) {
                setCartCount(total);
            }
        };

        // Nếu đã đăng nhập, tự động tải giỏ hàng lần đầu
        if (user) {
            refreshCart();
        }

        // Lắng nghe sự kiện toàn cục 'cartUpdated' (khi thêm sản phẩm hoặc checkout xong)
        const handleCartUpdated = () => {
            refreshCart();
        };

        // Đăng ký lắng nghe sự kiện trên window
        window.addEventListener("cartUpdated", handleCartUpdated);

        // Cleanup: Hủy lắng nghe sự kiện khi component bị gỡ bỏ
        return () => {
            cancelled = true;
            window.removeEventListener(
                "cartUpdated",
                handleCartUpdated
            );
        };
    }, [user, loadCart]);

    // BL-026: Xử lý Đăng xuất tài khoản - Xóa phiên JWT phía client và điều hướng về trang chủ
    function handleLogout() {
        // 1. Gọi hàm logout() từ AuthContext (xóa LocalStorage và reset state user)
        logout();
        // 2. Đặt lại số lượng giỏ hàng trên giao diện về 0
        setCartCount(0);
        // 3. Chuyển hướng người dùng về trang chủ (thay thế lịch sử duyệt để không back lại được)
        navigate("/", { replace: true });
    }

    return (
        <header className="auth-header">
            {/* Logo thương hiệu và liên kết về trang chủ */}
            <Link className="auth-header-brand" to="/">
                <span>CS</span>
                <strong>Clothing Shop</strong>
            </Link>

            {/* Khu vực các nút chức năng và thông tin tài khoản */}
            <nav
                className="auth-header-actions"
                aria-label="Tài khoản"
            >
                {/* Kiểm tra nếu người dùng đã đăng nhập */}
                {user ? (
                    <>
                        {/* BL-028: Nếu vai trò là ADMIN -> Hiển thị menu quản trị */}
                        {user.role === "ADMIN" && (
                            <>
                                {/* Liên kết tới trang Quản lý sản phẩm (BL-006) */}
                                <Link to="/admin/products">
                                    Quản lý sản phẩm
                                </Link>

                                {/* Liên kết tới trang Quản lý người dùng (BL-031) */}
                                <Link to="/admin/users">
                                    Quản lý người dùng
                                </Link>

                                {/* Liên kết tới trang Quản lý đơn hàng (BL-019) */}
                                <Link to="/admin/orders">
                                    Quản lý đơn hàng
                                </Link>
                            </>
                        )}

                        {/* BL-028: Nếu vai trò là CUSTOMER -> Hiển thị nút Giỏ hàng */}
                        {user.role === "CUSTOMER" && (
                            <Link
                                to="/cart"
                                className="auth-header-cart"
                                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
                            >
                                🛒 Giỏ hàng
                                <span className="cart-count">
                                    {cartCount}
                                </span>
                            </Link>
                        )}

                        {/* Hiển thị tên người dùng và nhãn vai trò */}
                        <span className="auth-header-user">
                            {user.fullName || user.username}
                            <small>{user.role}</small>
                        </span>

                        {/* BL-026: Nút Đăng xuất */}
                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </button>
                    </>
                ) : (
                    /* Nếu chưa đăng nhập -> Hiển thị nút Đăng nhập */
                    <Link
                        className="auth-header-login"
                        to="/login"
                    >
                        Đăng nhập
                    </Link>
                )}
            </nav>
        </header>
    );
}

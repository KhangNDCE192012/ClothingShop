
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";
import { getMyCart } from "../services/CartService";
import "../css/AuthHeader.css";

export default function AuthHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);

    // Lấy tổng số lượng sản phẩm trong giỏ hàng
    const loadCart = useCallback(async () => {
        if (!user) {
            return null;
        }

        try {
            const data = await getMyCart();

            const items = Array.isArray(data)
                ? data
                : data?.items ?? [];

            return items.length;
        } catch (error) {
            console.error("Không thể tải giỏ hàng:", error);
            return null;
        }
    }, [user]);

    // Tải giỏ hàng khi đăng nhập và khi có sự kiện cập nhật
    useEffect(() => {
        let cancelled = false;

        const refreshCart = async () => {
            if (!user) {
                return;
            }

            const total = await loadCart();

            if (!cancelled && total !== null) {
                setCartCount(total);
            }
        };

        if (user) {
            refreshCart();
        }

        const handleCartUpdated = () => {
            refreshCart();
        };

        window.addEventListener("cartUpdated", handleCartUpdated);

        return () => {
            cancelled = true;
            window.removeEventListener(
                "cartUpdated",
                handleCartUpdated
            );
        };
    }, [user, loadCart]);

    // Đăng xuất
    function handleLogout() {
        logout();
        setCartCount(0);
        navigate("/", { replace: true });
    }

    return (
        <header className="auth-header">
            <Link className="auth-header-brand" to="/">
                <span>CS</span>
                <strong>Clothing Shop</strong>
            </Link>

            <nav
                className="auth-header-actions"
                aria-label="Tài khoản"
            >
                {user ? (
                    <>

                        {user.role === "ADMIN" && (
                            <>
                                <Link to="/admin/users">
                                    Quản lý người dùng
                                </Link>

                                <Link to="/admin/orders">
                                    Quản lý đơn hàng
                                </Link>
                            </>
                        )}



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

                        <span className="auth-header-user">
                            {user.fullName || user.username}
                            <small>{user.role}</small>
                        </span>

                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </button>
                    </>
                ) : (
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

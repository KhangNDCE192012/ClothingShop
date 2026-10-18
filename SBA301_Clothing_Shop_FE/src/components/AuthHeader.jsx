import {Link, useNavigate} from "react-router-dom";
import useAuth from "../auth/useAuth";
import "../css/AuthHeader.css";

export default function AuthHeader() {
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/", {replace: true});
    }

    return (
        <header className="auth-header">
            <Link className="auth-header-brand" to="/">
                <span>CS</span>
                <strong>Clothing Shop</strong>
            </Link>

            <nav className="auth-header-actions" aria-label="Tài khoản">
                {user ? (
                    <>
                        {user.role === "ADMIN" && <Link to="/admin/users">Quản lý người dùng</Link>}
                        <span className="auth-header-user">
                            {user.fullName || user.username}
                            <small>{user.role}</small>
                        </span>
                        <button type="button" onClick={handleLogout}>Đăng xuất</button>
                    </>
                ) : (
                    <Link className="auth-header-login" to="/login">Đăng nhập</Link>
                )}
            </nav>
        </header>
    );
}

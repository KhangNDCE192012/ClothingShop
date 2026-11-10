import {useState} from "react";
import {Link, Navigate, useLocation, useNavigate} from "react-router-dom";
import useAuth from "../auth/useAuth";
import "../css/Login.css";

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Trang Đăng nhập hệ thống (BL-024, BL-025).
 * - Nhập thông tin tài khoản (username, password).
 * - Xác thực với backend qua Spring Security và lưu JWT token.
 * - Tự động điều hướng theo quyền hạn (Admin -> /admin/users, Customer -> trang trước đó hoặc /).
 */
export default function Login() {
    const {user, login} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Các state quản lý form đăng nhập
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    // Nhận thông báo thành công từ trang Register chuyển sang (nếu có)
    const [successMessage] = useState(location.state?.message || "");
    const [submitting, setSubmitting] = useState(false);

    // Nếu người dùng đã đăng nhập sẵn thì không hiển thị lại trang login
    if (user) {
        return <Navigate to={user.role === "ADMIN" ? "/admin/users" : "/"} replace />;
    }

    /**
     * BL-024 & BL-025: Xử lý submit form đăng nhập.
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Gọi login từ AuthContext để gửi request POST /api/auth/login
            const session = await login(username.trim(), password);
            // Xác định trang cần chuyển hướng tới sau khi login
            const requestedPath = location.state?.from;
            const destination = requestedPath
                || (session.user.role === "ADMIN" ? "/admin/users" : "/");
            navigate(destination, {replace: true});
        } catch (err) {
            setError(err.message || "Không thể đăng nhập. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card" aria-labelledby="login-title">
                <div className="login-brand-mark">CS</div>
                <p className="login-eyebrow">CLOTHING SHOP</p>
                <h1 id="login-title">Chào mừng trở lại</h1>
                <p className="login-description">Đăng nhập để tiếp tục sử dụng tài khoản của bạn.</p>

                {/* Thông báo đăng ký thành công nếu chuyển từ trang /register sang */}
                {successMessage && <div className="login-success" role="status">{successMessage}</div>}

                <form onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Nhập username"
                            maxLength={50}
                            required
                            autoFocus
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Nhập password"
                            required
                        />
                    </label>

                    {error && <div className="login-error" role="alert">{error}</div>}

                    <button type="submit" disabled={submitting || !username.trim() || !password}>
                        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                {/* Liên kết chuyển sang trang Đăng ký tài khoản (BL-023) */}
                <p className="login-switch">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            </section>
        </main>
    );
}

import {useState} from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import useAuth from "../auth/useAuth";
import "../css/Login.css";

export default function Login() {
    const {user, login} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={user.role === "ADMIN" ? "/admin/users" : "/"} replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const session = await login(username.trim(), password);
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
            </section>
        </main>
    );
}

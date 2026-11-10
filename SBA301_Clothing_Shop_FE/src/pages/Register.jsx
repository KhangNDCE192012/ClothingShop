import {useState} from "react";
import {Link, Navigate, useNavigate} from "react-router-dom";
import useAuth from "../auth/useAuth";
import {register} from "../services/AuthService";
import "../css/Register.css";

// Regex kiểm tra định dạng tên đăng nhập (chữ cái, số, dấu chấm, gạch dưới, gạch ngang)
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;
// Regex kiểm tra định dạng email chuẩn
const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// Regex kiểm tra định dạng số điện thoại (9-15 số, tùy chọn bắt đầu bằng +)
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Trang Đăng ký tài khoản khách hàng mới (BL-023).
 * - Thu thập thông tin: username, email, họ tên, số điện thoại, mật khẩu.
 * - Kiểm tra hợp lệ dữ liệu chặt chẽ ở phía Client trước khi gửi.
 * - Gửi request POST /api/auth/register lên backend, mật khẩu được mã hóa BCrypt.
 * - Đăng ký thành công sẽ tự động điều hướng sang màn hình /login.
 */
export default function Register() {
    const {user} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={user.role === "ADMIN" ? "/admin/users" : "/"} replace />;
    }

    function validateClient() {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedFullName = fullName.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedUsername) {
            return "Username không được để trống";
        }
        if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
            return "Username phải từ 3 đến 50 ký tự";
        }
        if (!USERNAME_REGEX.test(trimmedUsername)) {
            return "Username chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang";
        }

        if (!trimmedEmail) {
            return "Email không được để trống";
        }
        if (trimmedEmail.length > 100) {
            return "Email không được vượt quá 100 ký tự";
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return "Email không đúng định dạng";
        }

        if (trimmedFullName && trimmedFullName.length > 100) {
            return "Họ và tên không được vượt quá 100 ký tự";
        }

        if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
            return "Số điện thoại không hợp lệ (9-15 số, có thể bắt đầu bằng +)";
        }

        if (!trimmedPassword) {
            return "Mật khẩu không được để trống";
        }
        if (trimmedPassword.length < 6) {
            return "Mật khẩu phải có ít nhất 6 ký tự";
        }
        const utf8Bytes = new TextEncoder().encode(trimmedPassword);
        if (utf8Bytes.length > 72) {
            return "Mật khẩu không được vượt quá 72 byte";
        }

        if (trimmedPassword !== confirmPassword) {
            return "Mật khẩu xác nhận không khớp";
        }

        return null;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const validationError = validateClient();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            await register({
                username: username.trim(),
                password: password.trim(),
                email: email.trim().toLowerCase(),
                fullName: fullName.trim() || null,
                phone: phone.trim() || null,
            });

            navigate("/login", {
                state: {message: "Đăng ký thành công, vui lòng đăng nhập"},
                replace: true,
            });
        } catch (err) {
            setError(err.message || "Đăng ký không thành công. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="register-page">
            <section className="register-card" aria-labelledby="register-title">
                <div className="register-brand-mark">CS</div>
                <p className="register-eyebrow">CLOTHING SHOP</p>
                <h1 id="register-title">Tạo tài khoản</h1>
                <p className="register-description">Đăng ký để mua sắm và theo dõi đơn hàng của bạn.</p>

                <form onSubmit={handleSubmit} noValidate>
                    <label>
                        Username *
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Từ 3 đến 50 ký tự"
                            maxLength={50}
                            required
                            autoFocus
                        />
                    </label>

                    <label>
                        Email *
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="example@domain.com"
                            maxLength={100}
                            required
                        />
                    </label>

                    <label>
                        Họ và tên
                        <input
                            type="text"
                            name="fullName"
                            autoComplete="name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            maxLength={100}
                        />
                    </label>

                    <label>
                        Số điện thoại
                        <input
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Ví dụ: 0912345678"
                            maxLength={20}
                        />
                    </label>

                    <label>
                        Mật khẩu *
                        <input
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            required
                        />
                    </label>

                    <label>
                        Nhập lại mật khẩu *
                        <input
                            type="password"
                            name="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            required
                        />
                    </label>

                    {error && <div className="register-error" role="alert">{error}</div>}

                    <button
                        type="submit"
                        disabled={submitting || !username.trim() || !email.trim() || !password.trim() || !confirmPassword}
                    >
                        {submitting ? "Đang đăng ký..." : "Đăng ký tài khoản"}
                    </button>
                </form>

                <p className="register-switch">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </section>
        </main>
    );
}


import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyCart } from "../services/CartService";
import { getAccessToken } from "../services/AuthService";
import { getCurrentUser } from "../services/UserService";
import { createOrder } from "../services/OrderService";
import "../css/Checkout.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(price) || 0);


export default function Checkout() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        note: "",
        paymentMethod: "COD",
    });

    // Hỗ trợ giỏ hàng có hoặc không bọc trong thuộc tính variant.
    const getVariant = (item) => item?.variant ?? item;

    const getVariantId = (item) => {
        const id = getVariant(item)?.id;
        return id == null ? null : Number(id);
    };

    const getProductName = (item) =>
        getVariant(item)?.product?.name ??
        item?.product?.name ??
        "Sản phẩm";

    const getPrice = (item) =>
        Number(getVariant(item)?.price ?? item?.price ?? 0);

    const getQuantity = (item) => Number(item?.quantity ?? 0);

    const getImage = (item) =>
        getVariant(item)?.image ??
        getVariant(item)?.imageUrl ??
        "";

    const subtotal = items.reduce(
        (sum, item) => sum + getPrice(item) * getQuantity(item),
        0
    );

    // Chính sách phí vận chuyển mẫu.
    // Miễn phí từ 1.000.000đ, thấp hơn thì 30.000đ.
    const shippingFee = subtotal >= 1000000 ? 0 : 30000;
    const total = subtotal + shippingFee;

    const totalQuantity = items.reduce(
        (sum, item) => sum + getQuantity(item),
        0
    );

    // Tải hồ sơ và giỏ hàng.
    useEffect(() => {
        let cancelled = false;

        async function loadCheckout() {
            setLoading(true);
            setError("");

            try {
                const token = getAccessToken();

                if (!token) {
                    navigate("/login");
                    return;
                }

                const [user, cartData] = await Promise.all([
                    getCurrentUser(),
                    getMyCart(),
                ]);

                const cartItems = Array.isArray(cartData)
                    ? cartData
                    : cartData?.items ?? [];

                if (cancelled) return;

                setForm((prev) => ({
                    ...prev,
                    fullName:
                        user.fullName ??
                        user.full_name ??
                        user.name ??
                        "",
                    phone:
                        user.phone ??
                        user.phoneNumber ??
                        user.phone_number ??
                        "",
                    email: user.email ?? "",
                    paymentMethod: "COD",
                }));

                setItems(cartItems);

                if (cartItems.length === 0) {
                    setError("Giỏ hàng của bạn đang trống.");
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Không thể tải thông tin thanh toán."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCheckout();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Chỉ có một handleSubmit duy nhất.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (submitting) return;

        if (items.length === 0) {
            setError("Giỏ hàng đang trống, không thể đặt hàng.");
            return;
        }

        if (
            !form.fullName.trim() ||
            !form.phone.trim() ||
            !form.address.trim()
        ) {
            setError(
                "Vui lòng nhập họ tên, số điện thoại và địa chỉ giao hàng."
            );
            return;
        }

        // if (!/^[0-9+\s()-]{9,15}$/.test(form.phone.trim())) {
        //     setError("Số điện thoại không hợp lệ.");
        //     return;
        // }
        //
        // if (
        //     form.email &&
        //     !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        // ) {
        //     setError("Email không hợp lệ.");
        //     return;
        // }

        const invalidItem = items.some(
            (item) =>
                !Number.isInteger(getVariantId(item)) ||
                getVariantId(item) <= 0 ||
                !Number.isInteger(getQuantity(item)) ||
                getQuantity(item) <= 0
        );

        if (invalidItem) {
            setError(
                "Thông tin sản phẩm trong giỏ hàng không hợp lệ. " +
                "Vui lòng tải lại giỏ hàng."
            );
            return;
        }

        const token = getAccessToken();

        if (!token) {
            navigate("/login");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                recipientName: form.fullName.trim(),
                recipientPhone: form.phone.trim(),
                recipientEmail: form.email.trim(),
                shippingAddress: form.address.trim(),
                note: form.note.trim(),
                paymentMethod: "COD",
                items: items.map((item) => ({
                    variantId: getVariantId(item),
                    quantity: getQuantity(item),
                })),
            };

            const result = await createOrder(payload, token);

            const orderId = result?.orderId ?? result?.id;

            if (orderId == null) {
                throw new Error(
                    "Máy chủ đã phản hồi nhưng không có mã đơn hàng. " +
                    "Hãy kiểm tra API tạo đơn hàng."
                );
            }

            alert(`Đặt hàng thành công! Mã đơn hàng: ${orderId}`);
            window.dispatchEvent(new Event("cartUpdated"));
            navigate(`/orders/${orderId}`, { replace: true });
        } catch (err) {
            setError(err.message || "Không thể đặt hàng.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="checkout-page">
                <div className="checkout-state">
                    Đang tải thông tin thanh toán...
                </div>
            </main>
        );
    }

    return (
        <main className="checkout-page">
            <div className="checkout-container">
                <nav className="checkout-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/cart">Giỏ hàng</Link>
                    <span>/</span>
                    <strong>Thanh toán</strong>
                </nav>

                <header className="checkout-heading">
                    <span className="checkout-eyebrow">
                        YOUR ORDER
                    </span>
                    <h1>Thanh toán</h1>
                    <p>
                        Kiểm tra đơn hàng và hoàn tất thông tin nhận hàng.
                    </p>
                </header>

                {error && (
                    <div className="checkout-message" role="alert">
                        {error}

                        {items.length === 0 && (
                            <p>
                                <Link to="/">Tiếp tục mua sắm</Link>
                            </p>
                        )}
                    </div>
                )}

                {items.length > 0 && (
                    <form
                        className="checkout-layout"
                        onSubmit={handleSubmit}
                    >
                        <section className="checkout-form-card">
                            <h2>Thông tin nhận hàng</h2>

                            <div className="checkout-fields">
                                <label>
                                    Họ và tên *
                                    <input
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        placeholder="Họ và tên người nhận"
                                        autoComplete="name"
                                        maxLength={100}
                                        required
                                    />
                                </label>

                                <label>
                                    Số điện thoại *
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="09xxxxxxxx"
                                        autoComplete="tel"
                                        // pattern="[0-9+\s()-]{9,15}"
                                        maxLength={15}
                                        required
                                    />
                                </label>

                                <label>
                                    Email
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        autoComplete="email"
                                        maxLength={255}
                                    />
                                </label>

                                <label>
                                    Địa chỉ giao hàng *
                                    <textarea
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                                        autoComplete="street-address"
                                        maxLength={500}
                                        rows={3}
                                        required
                                    />
                                </label>

                                <label>
                                    Ghi chú đơn hàng
                                    <textarea
                                        name="note"
                                        value={form.note}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: giao trong giờ hành chính..."
                                        maxLength={500}
                                        rows={3}
                                    />
                                </label>
                            </div>

                            <div className="checkout-payment">
                                <h2>Phương thức thanh toán</h2>

                                <div className="checkout-payment-option">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={true}
                                        readOnly
                                    />

                                    <span>
                                        <strong>
                                            Thanh toán khi nhận hàng (COD)
                                        </strong>
                                        <small>
                                            Thanh toán trực tiếp cho nhân viên
                                            giao hàng khi nhận sản phẩm.
                                        </small>
                                    </span>
                                </div>
                            </div>
                        </section>

                        <aside className="checkout-summary">
                            <h2>Đơn hàng của bạn</h2>

                            <div className="checkout-items">
                                {items.map((item, index) => {
                                    const variant = getVariant(item);
                                    const variantId = getVariantId(item);

                                    return (
                                        <article
                                            className="checkout-item"
                                            key={
                                                item.id ??
                                                `${variantId ?? "variant"}-${index}`
                                            }
                                        >
                                            {getImage(item) ? (
                                                <img
                                                    src={getImage(item)}
                                                    alt={getProductName(item)}
                                                />
                                            ) : (
                                                <div className="checkout-no-image">
                                                    Chưa có ảnh
                                                </div>
                                            )}

                                            <div className="checkout-item-info">
                                                <strong>
                                                    {getProductName(item)}
                                                </strong>

                                                <span>
                                                    Màu:{" "}
                                                    {variant?.color ??
                                                        "Mặc định"}
                                                </span>

                                                <span>
                                                    Size:{" "}
                                                    {variant?.size ??
                                                        "Free size"}
                                                </span>

                                                <span>
                                                    Số lượng:{" "}
                                                    {getQuantity(item)}
                                                </span>
                                            </div>

                                            <strong className="checkout-item-price">
                                                {formatPrice(
                                                    getPrice(item) *
                                                    getQuantity(item)
                                                )}
                                            </strong>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="checkout-summary-row">
                                <span>Số loại sản phẩm</span>
                                <span>{items.length}</span>
                            </div>

                            <div className="checkout-summary-row">
                                <span>Tổng số lượng</span>
                                <span>{totalQuantity}</span>
                            </div>

                            <div className="checkout-summary-row">
                                <span>Tạm tính</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>

                            <div className="checkout-summary-row">
                                <span>Phí vận chuyển</span>
                                <span>
                                    {shippingFee === 0
                                        ? "Miễn phí"
                                        : formatPrice(shippingFee)}
                                </span>
                            </div>

                            <div className="checkout-total">
                                <span>Tổng thanh toán</span>
                                <strong>{formatPrice(total)}</strong>
                            </div>

                            <button
                                type="submit"
                                className="checkout-submit"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "ĐANG XỬ LÝ..."
                                    : "XÁC NHẬN ĐẶT HÀNG"}
                            </button>

                            <Link
                                to="/cart"
                                className="checkout-back"
                            >
                                ← Quay lại giỏ hàng
                            </Link>

                            <p className="checkout-disclaimer">
                                Phương thức thanh toán: COD.
                                Đơn hàng chỉ được xác nhận khi hệ thống
                                xử lý thành công.
                            </p>
                        </aside>
                    </form>
                )}
            </div>
        </main>
    );
}

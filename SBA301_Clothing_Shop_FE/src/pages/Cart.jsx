
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCart } from "../services/CartService";
import { getAccessToken } from "../services/AuthService";
import "../css/Cart.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(price) || 0);

export default function Cart() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadCart() {
            setLoading(true);
            setError("");

            try {
                if (!getAccessToken()) {
                    setError("Vui lòng đăng nhập để xem giỏ hàng.");
                    return;
                }

                const data = await getMyCart();
                const list = Array.isArray(data)
                    ? data
                    : data?.items ?? [];

                if (!cancelled) {
                    setItems(list);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Không thể tải giỏ hàng."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCart();

        return () => {
            cancelled = true;
        };
    }, []);

    const getVariant = (item) => item.variant ?? item;
    const getVariantId = (item) => {
        const variant = getVariant(item);
        return variant.id;
    };

    const getProductName = (item) => {
        const variant = getVariant(item);

        return (
            variant?.product?.name || "Sản phẩm"
        );
    };

    const getImage = (item) => {
        const variant = getVariant(item);

        return (
            variant?.image ??
            ""
        );
    };

    const getPrice = (item) => {
        const variant = getVariant(item);
        return Number(variant?.price ?? item?.price ?? 0);
    };

    const getQuantity = (item) => Number(item.quantity ?? 0);

    const totalQuantity = items.length;

    const subtotal = items.reduce(
        (sum, item) => sum + getPrice(item) * getQuantity(item),
        0
    );

    if (loading) {
        return (
            <main className="cart-page">
                <div className="cart-state">
                    <div className="cart-spinner" />
                    <p>Đang tải giỏ hàng...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="cart-page">
                <div className="cart-state">
                    <h2>Không thể mở giỏ hàng</h2>
                    <p>{error}</p>
                    <Link className="cart-primary-button" to="/login">
                        Đăng nhập
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="cart-page">
            <div className="cart-container">
                <nav className="cart-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <strong>Giỏ hàng</strong>
                </nav>

                <div className="cart-heading">
                    <div>
                        <span className="cart-eyebrow">
                            YOUR SELECTION
                        </span>
                        <h1>Giỏ hàng của bạn</h1>
                        <p>
                            Những lựa chọn dành riêng cho phong cách của bạn.
                        </p>
                    </div>

                    <span className="cart-item-count">
                        {totalQuantity} biến thể
                    </span>
                </div>

                {items.length === 0 ? (
                    <section className="cart-empty">
                        <div className="cart-empty-icon">🛒</div>
                        <h2>Giỏ hàng đang trống</h2>
                        <p>
                            Hãy khám phá bộ sưu tập và chọn sản phẩm yêu thích.
                        </p>
                        <Link to="/" className="cart-primary-button">
                            Tiếp tục mua sắm
                        </Link>
                    </section>
                ) : (
                    <div className="cart-layout">
                        <section className="cart-products">
                            <div className="cart-list-heading">
                                <span>SẢN PHẨM</span>
                                <span>THÀNH TIỀN</span>
                            </div>

                            {items.map((item, index) => {
                                const variant = getVariant(item);
                                const variantId = getVariantId(item);
                                const price = getPrice(item);
                                const quantity = getQuantity(item);
                                const image = getImage(item);

                                return (
                                    <article
                                        className="cart-product"
                                        key={
                                            item.id ??
                                            `${variantId ?? "variant"}-${index}`
                                        }
                                    >
                                        <Link
                                            to={
                                                variant?.product?.id
                                                    ? `/products/${variant.product.id}`
                                                    : "#"
                                            }
                                            className="cart-product-image"
                                            onClick={(event) => {
                                                if (!variant?.product?.id) {
                                                    event.preventDefault();
                                                }
                                            }}
                                        >
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={getProductName(item)}
                                                />
                                            ) : (
                                                <div className="cart-no-image">
                                                    Chưa có ảnh
                                                </div>
                                            )}
                                        </Link>

                                        <div className="cart-product-info">
                                            <h3>{getProductName(item)}</h3>

                                            <p>
                                                Màu sắc:{" "}
                                                {variant.color ?? "Mặc định"}
                                            </p>

                                            <p>
                                                Kích thước:{" "}
                                                {variant.size ?? "Free size"}
                                            </p>

                                            <p className="cart-variant-id">
                                                Mã variant: {variantId ?? "—"}
                                            </p>

                                            <strong className="cart-mobile-price">
                                                {formatPrice(price)}
                                            </strong>

                                            <div className="cart-quantity">
                                                <span>Số lượng:</span>
                                                <strong>{quantity}</strong>
                                            </div>
                                        </div>

                                        <div className="cart-product-total">
                                            <strong>
                                                {formatPrice(price * quantity)}
                                            </strong>
                                        </div>
                                    </article>
                                );
                            })}

                            <div className="cart-continue">
                                <Link to="/">
                                    ← Tiếp tục mua sắm
                                </Link>
                            </div>
                        </section>

                        <aside className="cart-summary">
                            <span className="cart-eyebrow">
                                ORDER SUMMARY
                            </span>

                            <h2>Tóm tắt đơn hàng</h2>

                            <div className="cart-summary-row">
                                <span>Số loại variant</span>
                                <span>{items.length}</span>
                            </div>

                            <div className="cart-summary-row">
                                <span>Tổng số sản phẩm</span>
                                <span>
                                    {items.reduce(
                                        (sum, item) =>
                                            sum + getQuantity(item),
                                        0
                                    )}
                                </span>
                            </div>

                            <div className="cart-summary-row">
                                <span>Tạm tính</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>

                            <div className="cart-summary-row">
                                <span>Phí vận chuyển</span>
                                <span>Tính khi thanh toán</span>
                            </div>

                            <div className="cart-summary-total">
                                <span>Tổng tiền</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>

                            <Link to="/checkout" className="cart-checkout-button">
                                TIẾN HÀNH THANH TOÁN
                            </Link>

                            <p className="cart-summary-note">
                                Phí vận chuyển và ưu đãi sẽ được xác nhận
                                khi thanh toán.
                            </p>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}

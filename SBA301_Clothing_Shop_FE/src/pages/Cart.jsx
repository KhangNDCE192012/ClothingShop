
/**
 * Trang Giỏ hàng (Cart) của khách hàng.
 * Hiển thị danh sách sản phẩm/biến thể đã chọn, cho phép tăng/giảm số lượng và tính tạm tính thành tiền.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCart } from "../services/CartService";
import { getAccessToken } from "../services/AuthService";
import { updateCartQuantity } from "../services/CartService";
import "../css/Cart.css";

/** Định dạng số tiền sang chuẩn tiền tệ VND */
const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(price) || 0);

export default function Cart() {
    // Danh sách các mục trong giỏ hàng
    const [items, setItems] = useState([]);
    // Trạng thái đang tải giỏ hàng từ API
    const [loading, setLoading] = useState(true);
    // Thông báo lỗi nếu có
    const [error, setError] = useState("");
    // Lưu ID biến thể đang trong quá trình cập nhật số lượng
    const [updatingId, setUpdatingId] = useState(null);

    // Tải thông tin giỏ hàng của người dùng khi component được mount
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

    /** Trích xuất đối tượng biến thể từ item */
    const getVariant = (item) => item.variant ?? item;

    /** Lấy ID của biến thể */
    const getVariantId = (item) => {
        const variant = getVariant(item);
        return variant.id;
    };

    /**
     * Xử lý tăng hoặc giảm số lượng biến thể trong giỏ hàng.
     * Gửi yêu cầu PUT tới API và tải lại dữ liệu mới nhất.
     */
    const handleQuantityChange = async (item, change) => {
        const variantId = getVariantId(item);
        const newQuantity = getQuantity(item) + change;

        if (!variantId || newQuantity < 1 || updatingId !== null) {
            return;
        }

        try {
            setUpdatingId(variantId);

            await updateCartQuantity(variantId, newQuantity);

            const data = await getMyCart();
            setItems(Array.isArray(data) ? data : data?.items ?? []);
        } catch (err) {
            setError(err.message || "Không thể cập nhật số lượng.");
        } finally {
            setUpdatingId(null);
        }
    };

    /** Lấy tên sản phẩm của biến thể */
    const getProductName = (item) => {
        const variant = getVariant(item);

        return (
            variant?.product?.name || "Sản phẩm"
        );
    };

    /** Lấy đường dẫn hình ảnh đại diện của biến thể */
    const getImage = (item) => {
        const variant = getVariant(item);

        return (
            variant?.image ??
            ""
        );
    };

    /** Lấy đơn giá của biến thể */
    const getPrice = (item) => {
        const variant = getVariant(item);
        return Number(variant?.price ?? item?.price ?? 0);
    };

    /** Lấy số lượng đặt mua của mục */
    const getQuantity = (item) => Number(item.quantity ?? 0);

    // Tổng số loại biến thể trong giỏ
    const totalQuantity = items.length;

    // Tổng số tiền tạm tính của giỏ hàng
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

                                                <div className="quantity-control">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item, -1)}
                                                        disabled={quantity <= 1 || updatingId !== null}
                                                    >
                                                        −
                                                    </button>

                                                    <strong>{quantity}</strong>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item, 1)}
                                                        disabled={updatingId !== null}
                                                    >
                                                        +
                                                    </button>
                                                </div>
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

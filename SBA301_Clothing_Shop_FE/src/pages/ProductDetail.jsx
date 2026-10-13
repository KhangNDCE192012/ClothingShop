import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {getVariants} from "../services/ProductService";
import "../css/ProductDetail.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price ?? 0);

export default function ProductDetail() {
    const {id} = useParams();

    const [variants, setVariants] = useState([]);
    const [selected, setSelected] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadProduct() {
            setLoading(true);
            setError("");

            try {
                const data = await getVariants(id);

                if (!active) return;

                const list = Array.isArray(data) ? data : [];
                setVariants(list);
                setSelected(list[0] ?? null);
                setQuantity(1);
            } catch (err) {
                if (active) setError(err.message || "Đã xảy ra lỗi.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadProduct();

        return () => {
            active = false;
        };
    }, [id]);

    const sizes = useMemo(
        () => [...new Set(variants.map((v) => v.size).filter(Boolean))],
        [variants]
    );

    const colors = useMemo(
        () => [...new Set(variants.map((v) => v.color).filter(Boolean))],
        [variants]
    );

    function selectVariant(variant) {
        if (!variant || variant.quantity <= 0) return;
        setSelected(variant);
        setQuantity(1);
    }

    function chooseSize(size) {
        const match = variants.find(
            (v) =>
                v.size === size &&
                v.color === selected?.color &&
                v.quantity > 0
        );

        const fallback = variants.find(
            (v) => v.size === size && v.quantity > 0
        );

        selectVariant(match || fallback);
    }

    function chooseColor(color) {
        const match = variants.find(
            (v) =>
                v.color === color &&
                v.size === selected?.size &&
                v.quantity > 0
        );

        const fallback = variants.find(
            (v) => v.color === color && v.quantity > 0
        );

        selectVariant(match || fallback);
    }

    if (loading) {
        return (
            <div className="detail-state">
                <div className="detail-spinner"/>
                <p>Đang tải sản phẩm...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-state">
                <h2>Không thể tải sản phẩm</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (!selected) {
        return (
            <div className="detail-state">
                <h2>Chưa có biến thể sản phẩm</h2>
                <Link to="/">Quay lại cửa hàng</Link>
            </div>
        );
    }

    const stock = selected.quantity ?? 0;

    return (
        <main className="product-detail">
            <div className="detail-container">
                <nav className="detail-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Sản phẩm</span>
                    <span>/</span>
                    <strong>Chi tiết</strong>
                </nav>

                <section className="detail-layout">
                    <div className="detail-gallery">
                        <div className="detail-image">
                            {selected.image ? (
                                <img
                                    src={selected.image}
                                    alt={`Sản phẩm ${selected.color || ""}`}
                                />
                            ) : (
                                <div className="detail-no-image">
                                    Chưa có hình ảnh sản phẩm
                                </div>
                            )}
                            <span className="detail-label">ESSENTIAL COLLECTION</span>
                        </div>
                        <p className="detail-caption">
                            ✦ Tối giản trong thiết kế, nổi bật trong phong cách.
                        </p>
                    </div>

                    <div className="detail-info">
                        <span className="detail-eyebrow">THỜI TRANG HẰNG NGÀY</span>
                        <h1>Basic T-Shirt</h1>
                        <p className="detail-description">
                            Thiết kế đơn giản, dễ phối đồ và phù hợp với nhiều phong cách.
                        </p>

                        <div className="detail-price-row">
                            <strong className="detail-price">
                                {formatPrice(selected.price)}
                            </strong>
                            <span className={stock > 0 ? "detail-in-stock" : "detail-out-stock"}>
                ● {stock > 0 ? "Còn hàng" : "Hết hàng"}
              </span>
                        </div>

                        <hr/>

                        <div className="detail-option">
                            <div className="detail-option-title">
                                <strong>Màu sắc</strong>
                                <span>{selected.color || "Chưa chọn"}</span>
                            </div>
                            <div className="detail-colors">
                                {colors.map((color) => {
                                    // const variant = variants.find(
                                    //     (v) => v.color === color
                                    // );

                                    const unavailable = !variants.some(
                                        (v) => v.color === color && v.quantity > 0
                                    );

                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            disabled={unavailable}
                                            className={`detail-color ${
                                                selected.color === color ? "active" : ""
                                            }`}
                                            onClick={() => chooseColor(color)}
                                        >

                                                <span
                                                    className="color-box"
                                                    style={{backgroundColor: color}}
                                                    title={color}
                                                />


                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="detail-option">
                            <div className="detail-option-title">
                                <strong>Kích thước</strong>
                                <span>Chọn size phù hợp</span>
                            </div>
                            <div className="detail-sizes">
                                {sizes.map((size) => {
                                    const unavailable = !variants.some(
                                        (v) =>
                                            v.color === selected?.color &&
                                            v.size === size &&
                                            v.quantity > 0
                                    );

                                    return (
                                        <button
                                            key={size}
                                            type="button"
                                            disabled={unavailable}
                                            className={`${selected.size === size ? "active" : ""} ${unavailable ? "unavailable" : ""}`}
                                            onClick={() => chooseSize(size)}
                                        >
                                            {size}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="detail-option">
                            <div className="detail-option-title">
                                <strong>Số lượng</strong>
                                <span>Còn {stock} sản phẩm</span>
                            </div>

                            <div className="detail-buy-row">
                                <div className="detail-quantity">
                                    <button
                                        type="button"
                                        disabled={quantity <= 1}
                                        onClick={() => setQuantity((q) => q - 1)}
                                    >
                                        −
                                    </button>
                                    <span>{quantity}</span>
                                    <button
                                        type="button"
                                        disabled={quantity >= stock}
                                        onClick={() => setQuantity((q) => q + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <span className="detail-total">
                  Tổng: <strong>{formatPrice(selected.price * quantity)}</strong>
                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="detail-add-cart"
                            disabled={stock <= 0}
                            onClick={() =>
                                alert(
                                    `Đã chọn biến thể ID ${selected.id}, số lượng ${quantity}. Cần kết nối API giỏ hàng để lưu sản phẩm.`
                                )
                            }
                        >
                            ＋ &nbsp; THÊM VÀO GIỎ HÀNG
                        </button>

                        <div className="detail-benefits">
                            <div><span>◇</span><p><strong>Chất lượng tuyển chọn</strong><small>Ưu tiên sự thoải
                                mái</small></p></div>
                            <div><span>↺</span><p><strong>Hỗ trợ khách hàng</strong><small>Đồng hành trong mua
                                sắm</small></p></div>
                            <div><span>♡</span><p><strong>Phong cách vượt thời gian</strong><small>Dễ phối đồ mỗi
                                ngày</small></p></div>
                        </div>
                    </div>
                </section>

                <section className="detail-variants">
                    <div className="detail-section-heading">
                        <div>
                            <span className="detail-eyebrow">YOUR CHOICE</span>
                            <h2>Các phiên bản sản phẩm</h2>
                        </div>
                        <span>{variants.length} biến thể</span>
                    </div>

                    <div className="detail-variant-grid">
                        {variants.map((variant) => (
                            <button
                                type="button"
                                key={variant.id}
                                className={`detail-variant-card ${
                                    selected.id === variant.id ? "active" : ""
                                }`}
                                onClick={() => selectVariant(variant)}
                            >
                                {variant.image ? (
                                    <img src={variant.image} alt={variant.color || "Sản phẩm"}/>
                                ) : (
                                    <div className="detail-no-image">Chưa có ảnh</div>
                                )}
                                <div className="detail-variant-body">
                                    <strong>{variant.color || "Màu mặc định"}</strong>
                                    <span>Size {variant.size || "Free size"}</span>
                                    <b>{formatPrice(variant.price)}</b>
                                    <small>
                                        {variant.quantity > 0
                                            ? `Còn ${variant.quantity} sản phẩm`
                                            : "Hết hàng"}
                                    </small>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

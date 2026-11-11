/**
 * Trang Chi tiết Sản phẩm (Product Detail).
 * Hiển thị hình ảnh, thông tin sản phẩm, danh sách biến thể (Size, Color), số lượng tồn kho
 * và hỗ trợ khách hàng chọn biến thể để thêm vào giỏ hàng (BL-011, BL-014).
 */
import {useEffect, useMemo, useState} from "react";
import {Link, useParams, useNavigate} from "react-router-dom";
import {getProductById} from "../services/ProductService";
import {addToCart} from "../services/CartService.jsx";
import "../css/ProductDetail.css";
import { getAccessToken } from "../services/AuthService";

/** Định dạng số tiền sang chuẩn VND */
const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price ?? 0);

export default function ProductDetail() {
    const {id} = useParams();
    const navigate = useNavigate();

    // Danh sách các biến thể của sản phẩm
    const [variants, setVariants] = useState([]);
    // Thông tin chi tiết sản phẩm
    const [product, setProduct] = useState(null);
    // Biến thể đang được người dùng lựa chọn (size, color, ảnh, tồn kho)
    const [selected, setSelected] = useState(null);
    // Số lượng đặt mua
    const [quantity, setQuantity] = useState(1);
    // Trạng thái đang tải dữ liệu
    const [loading, setLoading] = useState(true);
    // Thông báo lỗi
    const [error, setError] = useState("");

    /**
     * Xử lý thêm sản phẩm đã chọn vào giỏ hàng của người dùng.
     * Kiểm tra trạng thái đăng nhập, gọi API addToCart và thông báo kết quả.
     */
    const handleAddToCart = async () => {
        try {
            const token = getAccessToken();

            if (!token) {
                navigate("/login");
                return;
            }

            await addToCart(selected.id, quantity);

            window.dispatchEvent(new Event("cartUpdated"));

            alert("Đã thêm sản phẩm vào giỏ hàng!");
        } catch (error) {
            console.error("Lỗi thêm giỏ hàng:", error);
            alert(error.message);
        }
    };

    // Tải dữ liệu sản phẩm và các biến thể theo ID
    useEffect(() => {
        let active = true;

        async function loadProduct() {
            setLoading(true);
            setError("");

            try {
                const data = await getProductById(id);

                if (!active) return;

                const list = Array.isArray(data?.variants) ? data.variants : [];
                setProduct(data);
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

    // Danh sách các Size độc nhất từ các biến thể
    const sizes = useMemo(
        () => [...new Set(variants.map((v) => v.size).filter(Boolean))],
        [variants]
    );

    // Danh sách các Color độc nhất từ các biến thể
    const colors = useMemo(
        () => [...new Set(variants.map((v) => v.color).filter(Boolean))],
        [variants]
    );

    /** Chọn biến thể cụ thể */
    function selectVariant(variant) {
        if (!variant || variant.quantity <= 0) return;
        setSelected(variant);
        setQuantity(1);
    }

    /** Xử lý khi người dùng chọn kích cỡ (Size) */
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

    /** Xử lý khi người dùng chọn màu sắc (Color) */
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
                        <h1>{product?.name}</h1>
                        <p className="detail-description">Danh mục: {product?.categoryName}</p>

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
                                            aria-pressed={selected.color === color}
                                            onClick={() => chooseColor(color)}
                                        >
                                            {color}
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
                            onClick={handleAddToCart}
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

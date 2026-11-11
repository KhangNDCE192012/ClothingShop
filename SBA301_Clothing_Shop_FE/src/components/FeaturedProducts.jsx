/**
 * Component hiển thị danh sách sản phẩm nổi bật (Featured Products) trên Trang chủ.
 * Lọc lấy tối đa 8 sản phẩm có trạng thái ACTIVE mới nhất (BL-003, BL-005).
 */
import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {getProducts} from "../services/ProductService";
import "../css/FeaturedProducts.css";

/*
 * Nguyen Duy Khang
 * Hiển thị tối đa 8 sản phẩm ACTIVE mới nhất và điều hướng đến trang sản phẩm.
 */
export default function FeaturedProducts() {
    // State lưu trữ danh sách sản phẩm lấy từ backend
    const [products, setProducts] = useState([]);
    // State quản lý trạng thái đang nạp dữ liệu
    const [loading, setLoading] = useState(true);
    // State lưu thông báo lỗi nếu tải thất bại
    const [error, setError] = useState("");

    // Hook nạp dữ liệu sản phẩm từ API khi component xuất hiện trên giao diện
    useEffect(() => {
        // Cờ active ngăn chặn cập nhật state sau khi component bị unmount
        let active = true;

        // Gọi API getProducts() lấy danh sách sản phẩm
        getProducts()
            .then((data) => {
                // Đảm bảo dữ liệu nhận về là mảng và cập nhật vào state
                if (active) setProducts(Array.isArray(data) ? data : []);
            })
            .catch((requestError) => {
                // Bắt và ghi nhận lỗi nếu không gọi được API
                if (active) {
                    setError(requestError.message || "Không thể tải sản phẩm nổi bật.");
                }
            })
            .finally(() => {
                // Tắt trạng thái loading khi hoàn tất
                if (active) setLoading(false);
            });

        // Hủy cờ active khi component bị tháo dỡ
        return () => {
            active = false;
        };
    }, []);

    // Lọc ra tối đa 8 sản phẩm đang bán (ACTIVE) để làm sản phẩm nổi bật
    const featuredProducts = useMemo(
        () => products
            .filter((product) => String(product.status).toUpperCase() === "ACTIVE") // Chỉ lấy sản phẩm ACTIVE
            .slice(0, 8), // Giới hạn lấy tối đa 8 sản phẩm
        [products]
    );

    // Hàm định dạng số tiền sang chuẩn VND
    const formatPrice = (price) => {
        // Nếu giá trị chưa có thì trả về thông báo 'Đang cập nhật'
        if (price === null || price === undefined) return "Đang cập nhật";

        // Định dạng số tiền có ký hiệu ₫ và phân tách hàng nghìn
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <section className="featured-products" id="featured-products" aria-labelledby="featured-products-title">
            <div className="featured-products-container">
                <header className="featured-products-heading">
                    <p>FEATURED PRODUCTS</p>
                    <h2 id="featured-products-title">Sản phẩm nổi bật</h2>
                    <span>Khám phá những sản phẩm mới nhất của Clothing Shop.</span>
                </header>

                {loading ? (
                    <div className="featured-products-state">Đang tải sản phẩm nổi bật...</div>
                ) : error ? (
                    <div className="featured-products-state error" role="alert">{error}</div>
                ) : featuredProducts.length === 0 ? (
                    <div className="featured-products-state">Chưa có sản phẩm nổi bật.</div>
                ) : (
                    <div className="featured-products-grid">
                        {featuredProducts.map((product) => (
                            <article className="featured-product-card" key={product.id}>
                                {/* BL-005: dùng product.id thật, không dùng category.id. */}
                                <Link to={`/products/${product.id}`} aria-label={`Xem ${product.name}`}>
                                    <div className="featured-product-image">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name}/>
                                        ) : (
                                            <div>Chưa có hình ảnh</div>
                                        )}
                                        <span>{product.categoryName}</span>
                                    </div>

                                    <div className="featured-product-content">
                                        <h3>{product.name}</h3>
                                        <strong>{formatPrice(product.minPrice)}</strong>
                                        <span className="featured-product-link">Xem sản phẩm →</span>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

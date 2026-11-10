import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {getCategories} from "../services/CategoryService";
import {getProducts} from "../services/ProductService";
import "../css/CategoryProducts.css";

/*
 * Nguyen Duy Khang
 * Liệt kê sản phẩm ACTIVE trong một danh mục để khách chọn xem chi tiết.
 */
export default function CategoryProducts() {
    const {id} = useParams();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Tải danh mục và sản phẩm công khai; ID trong URL chỉ dùng để lọc sản phẩm.
    useEffect(() => {
        let active = true;
        Promise.all([getCategories(), getProducts()])
            .then(([categoryData, productData]) => {
                if (!active) return;
                setCategories(Array.isArray(categoryData) ? categoryData : []);
                setProducts(Array.isArray(productData) ? productData : []);
            })
            .catch((requestError) => {
                if (active) setError(requestError.message || "Không thể tải sản phẩm trong danh mục.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const category = categories.find((item) => String(item.id) === id);
    const categoryProducts = useMemo(() => products.filter((product) =>
        String(product.categoryId) === id && String(product.status).toUpperCase() === "ACTIVE"
    ), [products, id]);

    const formatPrice = (price) => price == null ? "Đang cập nhật" :
        new Intl.NumberFormat("vi-VN", {style: "currency", currency: "VND", maximumFractionDigits: 0}).format(price);

    return (
        <main className="category-products-page">
            <div className="category-products-container">
                <Link className="category-products-back" to="/#categories">← Về trang chủ</Link>
                {loading ? <p role="status">Đang tải sản phẩm...</p> : error ? (
                    <p className="category-products-error" role="alert">{error}</p>
                ) : !category ? (
                    <p className="category-products-error">Không tìm thấy danh mục này.</p>
                ) : (
                    <>
                        <header className="category-products-heading">
                            <span>DANH MỤC SẢN PHẨM</span>
                            <h1>{category.name}</h1>
                            <p>{categoryProducts.length} sản phẩm đang bán</p>
                        </header>
                        {categoryProducts.length === 0 ? (
                            <p className="category-products-empty">Danh mục này chưa có sản phẩm đang bán.</p>
                        ) : (
                            <div className="category-products-grid">
                                {categoryProducts.map((product) => (
                                    <article className="category-product-card" key={product.id}>
                                        {/* Trang chi tiết luôn nhận product.id, không nhận category.id. */}
                                        <Link to={`/products/${product.id}`}>
                                            <div className="category-product-image">
                                                {product.image ? <img src={product.image} alt={product.name}/> :
                                                    <span>Chưa có hình ảnh</span>}
                                            </div>
                                            <div className="category-product-info">
                                                <h2>{product.name}</h2>
                                                <strong>{formatPrice(product.minPrice)}</strong>
                                                <span>Xem chi tiết →</span>
                                            </div>
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

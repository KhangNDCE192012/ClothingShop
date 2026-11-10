import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {getCategories} from "../services/CategoryService";
import {getProducts} from "../services/ProductService";
import "../css/CategorySection.css";

/*
 * Nguyen Duy Khang
 * Hiển thị danh mục trên Home kèm ảnh và số sản phẩm đang bán.
 */
export default function CategorySection() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Ảnh danh mục lấy từ một sản phẩm thật khi danh mục chưa có ảnh riêng.
    useEffect(() => {
        let active = true;
        Promise.all([getCategories(), getProducts()])
            .then(([categoryData, productData]) => {
                if (!active) return;
                setCategories(Array.isArray(categoryData) ? categoryData : []);
                setProducts(Array.isArray(productData) ? productData : []);
            })
            .catch(() => { if (active) setError("Không thể tải danh mục sản phẩm."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <section className="category-section" id="categories" aria-labelledby="category-title">
            <div className="category-wrapper">
                <div className="category-heading">
                    <p className="category-label">CLOTHING SHOP</p>
                    <h2 className="category-title" id="category-title">Mua sắm theo danh mục</h2>
                    <p className="category-description">Chọn nhóm trang phục để xem các sản phẩm đang bán.</p>
                </div>
                {loading ? <p className="category-status">Đang tải danh mục...</p> : error ?
                    <p className="category-status category-status-error" role="alert">{error}</p> :
                    categories.length === 0 ? <p className="category-status">Chưa có danh mục.</p> : (
                        <div className="category-grid">
                            {categories.map((category, index) => {
                                const items = products.filter((product) =>
                                    String(product.categoryId) === String(category.id) && product.status === "ACTIVE");
                                const cover = category.image || items.find((product) => product.image)?.image;
                                return (
                                    <article className="category-card" key={category.id}>
                                        <Link className="category-card-link" to={`/categories/${category.id}`}
                                            aria-label={`Xem sản phẩm thuộc danh mục ${category.name}`}>
                                            <div className="category-card-image">
                                                {cover ? <img src={cover} alt=""/> :
                                                    <div className="category-no-image" aria-hidden="true">{category.name}</div>}
                                                <div className="category-overlay"/>
                                                <div className="category-card-top">
                                                    <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
                                                    <span className="category-arrow" aria-hidden="true">↗</span>
                                                </div>
                                            </div>
                                            <div className="category-card-content">
                                                <h3>{category.name}</h3>
                                                <p>{items.length} sản phẩm đang bán</p>
                                            </div>
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    )}
            </div>
        </section>
    );
}

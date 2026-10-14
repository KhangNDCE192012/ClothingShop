import { useEffect, useState } from "react";
import { getCategories } from "../services/CategoryService";
import "../css/CategorySection.css";

function CategorySection() {

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const loadCategories = async () => {

            try {

                const data = await getCategories();

                setCategories(data);

            } catch (err) {

                console.error(err);

                setError(
                    "Không thể tải danh mục sản phẩm."
                );

            } finally {

                setLoading(false);
            }
        };

        loadCategories();

    }, []);

    const formatPrice = (price) => {

        if (price === null || price === undefined) {
            return "Đang cập nhật";
        }

        return (
            Number(price).toLocaleString("vi-VN")
            + " ₫"
        );
    };

    return (
        <section className="category-section">

            <div className="category-wrapper">

                <div className="category-heading">

                    <p className="category-label">
                        SHOP BY CATEGORY
                    </p>

                    <h2 className="category-title">
                        Danh mục sản phẩm
                    </h2>

                    <div className="category-divider"></div>

                    <p className="category-description">
                        Khám phá các nhóm sản phẩm phù hợp
                        với phong cách của bạn.
                    </p>

                </div>

                {loading && (
                    <div className="category-status">
                        Đang tải danh mục...
                    </div>
                )}

                {error && (
                    <div className="category-status category-status-error">
                        {error}
                    </div>
                )}

                {!loading && !error && (

                    <div className="category-grid">

                        {categories.map((category, index) => (

                            <article
                                className="category-card"
                                key={category.id}
                            >

                                <div className="category-card-image">

                                    {category.image ? (

                                        <img
                                            src={category.image}
                                            alt={category.name}
                                        />

                                    ) : (

                                        <div className="category-no-image">
                                            Chưa có hình ảnh
                                        </div>

                                    )}

                                    <div className="category-overlay"></div>

                                    <div className="category-card-top">

                    <span className="category-number">
                      {String(index + 1)
                          .padStart(2, "0")}
                    </span>

                                        <span className="category-arrow">
                      ↗
                    </span>

                                    </div>

                                </div>

                                <div className="category-card-content">

                                    <h3>
                                        {category.name}
                                    </h3>

                                    <p className="category-card-description">
                                        Khám phá các sản phẩm thuộc danh mục này.
                                    </p>

                                    <div className="category-card-footer">

                    <span className="category-price-label">
                      Từ
                    </span>

                                        <span className="category-price">
                      {formatPrice(
                          category.minPrice
                      )}
                    </span>

                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </div>

        </section>
    );
}

export default CategorySection;
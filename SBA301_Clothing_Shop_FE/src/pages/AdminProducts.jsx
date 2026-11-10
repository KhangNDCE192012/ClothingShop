import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {getProducts} from "../services/ProductService";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "../services/CategoryService";
import "../css/AdminProducts.css";

/*
 * Nguyen Duy Khang
 * Trang quản lý Product BL-006/BL-007/BL-008 và Category BL-012 dành cho ADMIN.
 */
export default function AdminProducts() {
    // State lưu dữ liệu từ backend và trạng thái hiển thị của trang.
    const [products, setProducts] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [categoryPending, setCategoryPending] = useState(false);
    const [categoryMessage, setCategoryMessage] = useState("");
    const [categoryError, setCategoryError] = useState("");

    /** Tải lại danh sách, đồng thời xử lý loading và lỗi tại một nơi. */
    async function loadProducts() {
        setLoading(true);
        setError("");

        try {
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setError(requestError.message || "Đã xảy ra lỗi khi tải sản phẩm.");
        } finally {
            setLoading(false);
        }
    }

    // Chỉ gọi API một lần khi ADMIN mở trang; cờ active tránh cập nhật sau khi rời trang.
    useEffect(() => {
        let active = true;

        Promise.all([getProducts(), getCategories()])
            .then(([productData, categoryData]) => {
                if (!active) return;
                setProducts(Array.isArray(productData) ? productData : []);
                setCategories(Array.isArray(categoryData) ? categoryData : []);
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.message || "Đã xảy ra lỗi khi tải sản phẩm.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    /** Tạo Category và thêm ngay vào dropdown của form Product. */
    async function handleCreateCategory(event) {
        event.preventDefault();
        setCategoryPending(true);
        setCategoryMessage("");
        setCategoryError("");

        try {
            const created = await createCategory(categoryName.trim());
            setCategories((current) => [...current, created]);
            setCategoryName("");
            setCategoryMessage(`Đã tạo danh mục “${created.name}”.`);
        } catch (requestError) {
            setCategoryError(requestError.message || "Không thể tạo danh mục.");
        } finally {
            setCategoryPending(false);
        }
    }

    async function handleUpdateCategory(categoryId) {
        setCategoryPending(true);
        setCategoryMessage("");
        setCategoryError("");

        try {
            const updated = await updateCategory(categoryId, editingCategoryName.trim());
            setCategories((current) => current.map((item) =>
                item.id === updated.id ? {...item, ...updated} : item
            ));
            setEditingCategoryId(null);
            setEditingCategoryName("");
            setCategoryMessage(`Đã cập nhật danh mục “${updated.name}”.`);
        } catch (requestError) {
            setCategoryError(requestError.message || "Không thể cập nhật danh mục.");
        } finally {
            setCategoryPending(false);
        }
    }

    async function handleDeleteCategory(category) {
        if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;

        setCategoryPending(true);
        setCategoryMessage("");
        setCategoryError("");

        try {
            await deleteCategory(category.id);
            setCategories((current) => current.filter((item) => item.id !== category.id));
            setCategoryMessage(`Đã xóa danh mục “${category.name}”.`);
        } catch (requestError) {
            setCategoryError(requestError.message || "Không thể xóa danh mục.");
        } finally {
            setCategoryPending(false);
        }
    }

    // Tạo danh sách trạng thái động từ dữ liệu backend để tránh viết cứng.
    const statuses = useMemo(
        () => [...new Set(products.map((product) => product.status).filter(Boolean))],
        [products]
    );

    // Lọc ở frontend theo tên, mã, danh mục và trạng thái.
    const filteredProducts = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");

        return products.filter((product) => {
            const matchesStatus = statusFilter === "ALL"
                || product.status === statusFilter;
            const searchableValues = [
                product.id,
                product.name,
                product.categoryName,
            ];
            const matchesKeyword = !normalizedKeyword
                || searchableValues.some((value) => String(value ?? "")
                    .toLocaleLowerCase("vi")
                    .includes(normalizedKeyword));

            return matchesStatus && matchesKeyword;
        });
    }, [products, keyword, statusFilter]);

    const formatDate = (value) => value
        ? new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value))
        : "—";

    return (
        <main className="admin-products-page">
            <section className="admin-products-container">
                <header className="admin-products-heading">
                    <div>
                        <p>PRODUCT MANAGEMENT</p>
                        <h1>Danh sách sản phẩm</h1>
                        <span>Xem và tra cứu sản phẩm hiện có trong hệ thống.</span>
                    </div>

                    <div className="admin-products-heading-actions">
                        <Link to="/admin/products/new">+ Thêm sản phẩm</Link>
                        <button type="button" onClick={loadProducts} disabled={loading}>
                            ↻ {loading ? "Đang tải..." : "Làm mới"}
                        </button>
                    </div>
                </header>

                <section className="admin-category-card" aria-labelledby="category-management-title">
                    <div className="admin-category-heading">
                        <div>
                            <p>CATEGORY MANAGEMENT</p>
                            <h2 id="category-management-title">Quản lý danh mục</h2>
                        </div>

                        <form onSubmit={handleCreateCategory}>
                            <input
                                value={categoryName}
                                maxLength={100}
                                required
                                onChange={(event) => setCategoryName(event.target.value)}
                                placeholder="Tên danh mục mới"
                                aria-label="Tên danh mục mới"
                            />
                            <button type="submit" disabled={categoryPending}>+ Thêm danh mục</button>
                        </form>
                    </div>

                    <div className="admin-category-list">
                        {categories.map((category) => (
                            <article key={category.id}>
                                {editingCategoryId === category.id ? (
                                    <input
                                        value={editingCategoryName}
                                        maxLength={100}
                                        onChange={(event) => setEditingCategoryName(event.target.value)}
                                        aria-label={`Tên mới của ${category.name}`}
                                    />
                                ) : (
                                    <span>#{category.id} · <strong>{category.name}</strong></span>
                                )}

                                <div>
                                    {editingCategoryId === category.id ? (
                                        <>
                                            <button
                                                type="button"
                                                disabled={categoryPending || !editingCategoryName.trim()}
                                                onClick={() => handleUpdateCategory(category.id)}
                                            >Lưu</button>
                                            <button type="button" onClick={() => setEditingCategoryId(null)}>Hủy</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingCategoryId(category.id);
                                                    setEditingCategoryName(category.name);
                                                }}
                                            >Đổi tên</button>
                                            <button
                                                type="button"
                                                disabled={categoryPending}
                                                onClick={() => handleDeleteCategory(category)}
                                            >Xóa</button>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {categoryMessage && <p className="category-action-success" role="status">{categoryMessage}</p>}
                    {categoryError && <p className="category-action-error" role="alert">{categoryError}</p>}
                </section>

                <section className="admin-products-summary" aria-label="Thống kê sản phẩm">
                    <article>
                        <span>Tổng sản phẩm</span>
                        <strong>{products.length}</strong>
                    </article>
                    <article>
                        <span>Đang hoạt động</span>
                        <strong>{products.filter((product) => product.status === "ACTIVE").length}</strong>
                    </article>
                    <article>
                        <span>Kết quả hiển thị</span>
                        <strong>{filteredProducts.length}</strong>
                    </article>
                </section>

                <section className="admin-products-card">
                    <div className="admin-products-toolbar">
                        <input
                            type="search"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder="Tìm theo mã, tên hoặc danh mục..."
                            aria-label="Tìm sản phẩm"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            aria-label="Lọc theo trạng thái"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="admin-products-message">Đang tải danh sách sản phẩm...</div>
                    ) : error ? (
                        <div className="admin-products-message error" role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={loadProducts}>Thử lại</button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="admin-products-message">Không tìm thấy sản phẩm phù hợp.</div>
                    ) : (
                        <div className="admin-products-table-wrapper">
                            <table className="admin-products-table">
                                <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td className="product-code">#{product.id}</td>
                                        <td><Link to={`/products/${product.id}`}><strong>{product.name}</strong></Link></td>
                                        <td>{product.categoryName || "—"}</td>
                                        <td>
                                            <span className={`product-status status-${String(product.status).toLowerCase()}`}>
                                                {product.status || "—"}
                                            </span>
                                        </td>
                                        <td>{formatDate(product.createdAt)}</td>
                                        <td>
                                            <Link
                                                className="product-edit-button"
                                                to={`/admin/products/${product.id}/edit`}
                                            >
                                                Chỉnh sửa
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && !error && (
                        <footer>
                            Hiển thị {filteredProducts.length} / {products.length} sản phẩm
                        </footer>
                    )}
                </section>
            </section>
        </main>
    );
}

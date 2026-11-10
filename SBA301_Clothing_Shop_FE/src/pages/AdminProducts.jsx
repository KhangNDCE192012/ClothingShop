import {useEffect, useMemo, useState} from "react";
import {createProduct, getProducts} from "../services/ProductService";
import {getCategories} from "../services/CategoryService";
import "../css/AdminProducts.css";

/*
 * Nguyen Duy Khang
 * Trang ADMIN hiển thị danh sách BL-006 và form tạo sản phẩm BL-007.
 */
export default function AdminProducts() {
    // State lưu dữ liệu từ backend và trạng thái hiển thị của trang.
    const [products, setProducts] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({name: "", categoryId: "", status: "ACTIVE"});
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createMessage, setCreateMessage] = useState("");

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

    /** Gửi form, thêm product vừa tạo lên đầu bảng và xóa dữ liệu form. */
    async function handleCreateProduct(event) {
        event.preventDefault();
        setSubmitting(true);
        setCreateError("");
        setCreateMessage("");

        try {
            const createdProduct = await createProduct({
                name: form.name.trim(),
                categoryId: Number(form.categoryId),
                status: form.status,
            });

            setProducts((current) => [createdProduct, ...current]);
            setForm({name: "", categoryId: "", status: "ACTIVE"});
            setCreateMessage(`Đã tạo sản phẩm “${createdProduct.name}” thành công.`);
        } catch (requestError) {
            setCreateError(requestError.message || "Không thể tạo sản phẩm.");
        } finally {
            setSubmitting(false);
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
                        <p>BL-006 · PRODUCT MANAGEMENT</p>
                        <h1>Danh sách sản phẩm</h1>
                        <span>Xem và tra cứu sản phẩm hiện có trong hệ thống.</span>
                    </div>

                    <button type="button" onClick={loadProducts} disabled={loading}>
                        ↻ {loading ? "Đang tải..." : "Làm mới"}
                    </button>
                </header>

                <section className="admin-product-create-card" aria-labelledby="create-product-title">
                    <div>
                        <p>BL-007 · ADD PRODUCT</p>
                        <h2 id="create-product-title">Thêm sản phẩm mới</h2>
                        <span>Nhập thông tin cơ bản; ảnh, giá và tồn kho sẽ thuộc phần Variant.</span>
                    </div>

                    <form className="admin-product-create-form" onSubmit={handleCreateProduct}>
                        <label>
                            Tên sản phẩm
                            <input
                                type="text"
                                value={form.name}
                                maxLength={150}
                                required
                                onChange={(event) => setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))}
                                placeholder="Ví dụ: Áo thun Essential"
                            />
                        </label>

                        <label>
                            Danh mục
                            <select
                                value={form.categoryId}
                                required
                                onChange={(event) => setForm((current) => ({
                                    ...current,
                                    categoryId: event.target.value,
                                }))}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Trạng thái
                            <select
                                value={form.status}
                                onChange={(event) => setForm((current) => ({
                                    ...current,
                                    status: event.target.value,
                                }))}
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </label>

                        <button type="submit" disabled={submitting || categories.length === 0}>
                            {submitting ? "Đang tạo..." : "+ Thêm sản phẩm"}
                        </button>
                    </form>

                    {createMessage && <p className="product-create-success" role="status">{createMessage}</p>}
                    {createError && <p className="product-create-error" role="alert">{createError}</p>}
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
                                </tr>
                                </thead>
                                <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td className="product-code">#{product.id}</td>
                                        <td><strong>{product.name}</strong></td>
                                        <td>{product.categoryName || "—"}</td>
                                        <td>
                                            <span className={`product-status status-${String(product.status).toLowerCase()}`}>
                                                {product.status || "—"}
                                            </span>
                                        </td>
                                        <td>{formatDate(product.createdAt)}</td>
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

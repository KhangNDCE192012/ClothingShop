import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {getCategories} from "../services/CategoryService";
import {createProduct, getProductById, updateProduct} from "../services/ProductService";
import "../css/AdminProductCreate.css";

/*
 * Nguyen Duy Khang
 * Form tạo, sửa sản phẩm và cập nhật tồn kho theo biến thể (BL-007/008/010).
 */
const emptyVariant = () => ({size: "", color: "", image: "", quantity: "", price: ""});

export default function AdminProductCreate() {
    const {id} = useParams();
    const editing = Boolean(id);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({name: "", categoryId: "", status: "ACTIVE"});
    const [variants, setVariants] = useState([emptyVariant()]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([getCategories(), editing ? getProductById(id) : Promise.resolve(null)])
            .then(([items, product]) => {
                if (!active) return;
                setCategories(Array.isArray(items) ? items : []);
                if (product) {
                    setForm({name: product.name, categoryId: String(product.categoryId), status: product.status});
                    setVariants(product.variants.length > 0
                        ? product.variants.map((item) => ({
                            id: item.id,
                            size: item.size ?? "",
                            color: item.color ?? "",
                            image: item.image ?? "",
                            quantity: String(item.quantity),
                            price: String(item.price),
                        }))
                        : [emptyVariant()]);
                }
            })
            .catch((requestError) => { if (active) setError(requestError.message || "Không tải được dữ liệu sản phẩm."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [editing, id]);

    function changeVariant(index, field, value) {
        setVariants((current) => current.map((item, position) =>
            position === index ? {...item, [field]: value} : item
        ));
    }

    /** Gửi thông tin sản phẩm và số lượng từng biến thể trong một lần lưu. */
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                categoryId: Number(form.categoryId),
                status: form.status,
                variants: variants.map((item) => ({
                    ...(item.id ? {id: item.id} : {}),
                    size: item.size.trim(),
                    color: item.color.trim(),
                    image: item.image.trim(),
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                })),
            };
            const saved = editing ? await updateProduct(id, payload) : await createProduct(payload);
            if (editing) {
                // Đồng bộ ID và tồn kho mới để lần lưu tiếp theo cập nhật đúng biến thể.
                const detail = await getProductById(id);
                setForm({name: detail.name, categoryId: String(detail.categoryId), status: detail.status});
                setVariants(detail.variants.map((item) => ({
                    id: item.id, size: item.size ?? "", color: item.color ?? "",
                    image: item.image ?? "", quantity: String(item.quantity), price: String(item.price),
                })));
            } else {
                setForm({name: "", categoryId: "", status: "ACTIVE"});
                setVariants([emptyVariant()]);
            }
            setSuccess(`Đã ${editing ? "cập nhật" : "tạo"} sản phẩm “${saved.name}” thành công.`);
        } catch (requestError) {
            setError(requestError.message || "Không thể lưu sản phẩm.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="admin-create-page">
            <div className="admin-create-container">
                <Link to="/admin/products">← Danh sách sản phẩm</Link>
                <h1>{editing ? `Chỉnh sửa sản phẩm #${id}` : "Thêm sản phẩm mới"}</h1>
                <p>Nhập thông tin sản phẩm và biến thể để trang chi tiết hiển thị đầy đủ.</p>
                <form onSubmit={handleSubmit}>
                    <section className="admin-create-section">
                        <h2>Thông tin sản phẩm</h2>
                        <div className="admin-create-grid">
                            <label>Tên sản phẩm
                                <input required maxLength={150} value={form.name}
                                       onChange={(event) => setForm({...form, name: event.target.value})}/>
                            </label>
                            <label>Danh mục
                                <select required value={form.categoryId}
                                        onChange={(event) => setForm({...form, categoryId: event.target.value})}>
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </label>
                            <label>Trạng thái
                                <select value={form.status}
                                        onChange={(event) => setForm({...form, status: event.target.value})}>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </label>
                        </div>
                    </section>
                    <section className="admin-create-section">
                        <h2>Biến thể và tồn kho</h2>
                        {editing && <p>Nhập số lượng tồn kho mới cho từng biến thể rồi bấm Lưu thay đổi.</p>}
                        {variants.map((item, index) => (
                            <div className="admin-create-variant" key={index}>
                                <h3>Biến thể {index + 1}</h3>
                                <div className="admin-create-grid">
                                    <label>Size<input required maxLength={50} value={item.size}
                                        onChange={(event) => changeVariant(index, "size", event.target.value)}/></label>
                                    <label>Màu sắc<input required maxLength={50} value={item.color}
                                        onChange={(event) => changeVariant(index, "color", event.target.value)}/></label>
                                    <label>Giá (VND)<input required type="number" min="0.01" step="0.01" value={item.price}
                                        onChange={(event) => changeVariant(index, "price", event.target.value)}/></label>
                                    <label>Tồn kho<input required type="number" min="0" step="1" value={item.quantity}
                                        onChange={(event) => changeVariant(index, "quantity", event.target.value)}/></label>
                                    <label className="admin-create-image">URL hình ảnh<input required type="url" maxLength={1000} value={item.image}
                                        placeholder="https://example.com/product.jpg"
                                        onChange={(event) => changeVariant(index, "image", event.target.value)}/></label>
                                </div>
                                {variants.length > 1 && !item.id && <button type="button" className="admin-create-remove"
                                    onClick={() => setVariants((current) => current.filter((_, position) => position !== index))}>
                                    Xóa biến thể
                                </button>}
                                {editing && item.id && <small>Biến thể đã lưu được giữ lại để bảo toàn giỏ hàng và đơn hàng.</small>}
                            </div>
                        ))}
                        <button type="button" className="admin-create-add"
                            onClick={() => setVariants((current) => [...current, emptyVariant()])}>+ Thêm biến thể</button>
                    </section>
                    {error && <p className="admin-create-error" role="alert">{error}</p>}
                    {success && <p className="admin-create-success" role="status">{success}</p>}
                    <button className="admin-create-submit" type="submit" disabled={saving || loading || categories.length === 0}>
                        {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo sản phẩm"}
                    </button>
                </form>
            </div>
        </main>
    );
}

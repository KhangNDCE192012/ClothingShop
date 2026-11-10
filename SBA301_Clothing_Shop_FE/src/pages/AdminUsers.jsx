import {useEffect, useMemo, useState} from "react";
import {deleteCustomer, getCustomers, lockCustomer, updateCustomer} from "../services/UserService";
import "../css/AdminUsers.css";

/**
 * Định dạng ngày giờ hiển thị theo chuẩn tiếng Việt (dd/MM/yyyy HH:mm).
 */
const formatDate = (value) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

/**
 * Chuẩn hóa chuỗi văn bản phục vụ tìm kiếm không phân biệt chữ hoa/thường.
 */
const normalize = (value) => String(value ?? "").toLocaleLowerCase("vi");

/**
 * Nguyen Duy Khang / Khoi Nguyen
 * Trang quản lý tài khoản khách hàng dành cho ADMIN.
 * Bao gồm các chức năng:
 * - BL-031: Xem danh sách khách hàng (Customer), tìm kiếm và lọc trạng thái.
 * - BL-032: Khóa tài khoản khách hàng (status: BANNED).
 * - BL-033: Xóa tài khoản khách hàng.
 * - BL-034: Cập nhật thông tin tài khoản (Họ tên, email, phone, status, role).
 */
export default function AdminUsers() {
    // BL-031: Danh sách khách hàng tải từ backend
    const [customers, setCustomers] = useState([]);
    // BL-031: Từ khóa tìm kiếm theo tên, username, email, số điện thoại
    const [search, setSearch] = useState("");
    // BL-031: Bộ lọc trạng thái (ALL, ACTIVE, INACTIVE, BANNED)
    const [status, setStatus] = useState("ALL");
    // Trạng thái đang tải dữ liệu danh sách
    const [loading, setLoading] = useState(true);
    // Lỗi khi tải dữ liệu từ backend
    const [error, setError] = useState("");
    // Lỗi khi thực hiện thao tác (khóa, xóa, cập nhật)
    const [actionError, setActionError] = useState("");
    // Thao tác đang thực thi trên 1 dòng để tránh bấm lặp lại
    const [pendingAction, setPendingAction] = useState(null);

    // BL-034: Trạng thái modal chỉnh sửa thông tin tài khoản
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editForm, setEditForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        status: "ACTIVE",
        role: "CUSTOMER",
    });
    const [editError, setEditError] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    /**
     * BL-031: Hàm tải danh sách khách hàng từ backend thông qua getCustomers().
     */
    async function loadCustomers() {
        setLoading(true);
        setError("");

        try {
            const data = await getCustomers();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * BL-031: Hook chạy 1 lần khi trang được nạp để lấy dữ liệu ban đầu.
     */
    useEffect(() => {
        let active = true;

        getCustomers()
            .then((data) => {
                if (active) setCustomers(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (active) setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    /**
     * BL-031: Trích xuất danh sách các trạng thái duy nhất có trong dữ liệu khách hàng.
     */
    const statuses = useMemo(
        () => [...new Set(customers.map((customer) => customer.status).filter(Boolean))],
        [customers]
    );

    /**
     * BL-031: Lọc danh sách khách hàng dựa trên từ khóa tìm kiếm và trạng thái đang chọn.
     */
    const filteredCustomers = useMemo(() => {
        const keyword = normalize(search.trim());

        return customers.filter((customer) => {
            const matchesStatus = status === "ALL" || customer.status === status;
            const matchesSearch = !keyword || [
                customer.fullName,
                customer.username,
                customer.email,
                customer.phone,
            ].some((value) => normalize(value).includes(keyword));

            return matchesStatus && matchesSearch;
        });
    }, [customers, search, status]);

    /**
     * BL-034: Mở modal chỉnh sửa và nạp thông tin của khách hàng vào form.
     */
    function handleOpenEdit(customer) {
        setEditingCustomer(customer);
        setEditForm({
            fullName: customer.fullName || "",
            email: customer.email || "",
            phone: customer.phone || "",
            status: customer.status || "ACTIVE",
            role: customer.role || "CUSTOMER",
        });
        setEditError("");
    }

    /**
     * BL-034: Đóng modal chỉnh sửa (chặn đóng khi đang lưu).
     */
    function handleCloseEdit() {
        if (editSaving) return;
        setEditingCustomer(null);
        setEditError("");
    }

    /**
     * BL-034: Cập nhật giá trị các trường trong form chỉnh sửa.
     */
    function handleEditChange(e) {
        const {name, value} = e.target;
        setEditForm((prev) => ({...prev, [name]: value}));
    }

    /**
     * BL-034: Validate dữ liệu form phía client và gửi request cập nhật lên server.
     */
    async function handleSaveEdit(e) {
        e.preventDefault();
        setEditError("");

        const trimmedFullName = editForm.fullName.trim();
        const trimmedEmail = editForm.email.trim();
        const trimmedPhone = editForm.phone.trim();

        // Kiểm tra bắt buộc email
        if (!trimmedEmail) {
            setEditError("Email không được để trống.");
            return;
        }

        // Kiểm tra định dạng email và độ dài tối đa
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 100) {
            setEditError("Email không đúng định dạng hoặc vượt quá 100 ký tự.");
            return;
        }

        // Kiểm tra độ dài họ và tên
        if (trimmedFullName.length > 100) {
            setEditError("Họ và tên không được vượt quá 100 ký tự.");
            return;
        }

        // Kiểm tra định dạng số điện thoại (nếu có nhập)
        if (trimmedPhone) {
            const phoneRegex = /^\+?[0-9]{9,15}$/;
            if (!phoneRegex.test(trimmedPhone)) {
                setEditError("Số điện thoại không hợp lệ (phải từ 9-15 chữ số, có thể bắt đầu bằng +).");
                return;
            }
        }

        setEditSaving(true);
        try {
            const payload = {
                fullName: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone,
                status: editForm.status,
                role: editForm.role,
            };
            const updated = await updateCustomer(editingCustomer.id, payload);
            // Cập nhật lại đối tượng trong state customers mà không cần tải lại toàn bộ trang
            setCustomers((current) =>
                current.map((item) => (item.id === updated.id ? updated : item))
            );
            setEditingCustomer(null);
        } catch (err) {
            setEditError(err.message || "Không thể cập nhật thông tin tài khoản.");
        } finally {
            setEditSaving(false);
        }
    }

    /**
     * BL-032: Khóa tài khoản khách hàng sau khi xác nhận hộp thoại confirm.
     */
    async function handleLock(customer) {
        const confirmed = window.confirm(
            `Khóa tài khoản “${customer.username}”? Tài khoản này sẽ bị hạn chế sử dụng hệ thống.`
        );

        if (!confirmed) return;

        setPendingAction({id: customer.id, type: "lock"});
        setActionError("");

        try {
            const updatedCustomer = await lockCustomer(customer.id);
            setCustomers((current) => current.map((item) =>
                item.id === updatedCustomer.id ? updatedCustomer : item
            ));
        } catch (err) {
            setActionError(err.message || "Không thể khóa tài khoản.");
        } finally {
            setPendingAction(null);
        }
    }

    /**
     * BL-033: Xóa vĩnh viễn tài khoản khách hàng sau khi xác nhận hộp thoại confirm.
     */
    async function handleDelete(customer) {
        const confirmed = window.confirm(
            `Xóa vĩnh viễn tài khoản “${customer.username}”? Thao tác này không thể hoàn tác.`
        );

        if (!confirmed) return;

        setPendingAction({id: customer.id, type: "delete"});
        setActionError("");

        try {
            await deleteCustomer(customer.id);
            // Xóa khách hàng khỏi mảng state hiện tại
            setCustomers((current) => current.filter((item) => item.id !== customer.id));
        } catch (err) {
            setActionError(err.message || "Không thể xóa tài khoản.");
        } finally {
            setPendingAction(null);
        }
    }

    return (
        <main className="admin-users-page">
            <div className="admin-content">
                {/* Phần tiêu đề trang */}
                <section className="admin-page-heading">
                    <div>
                        <p className="admin-eyebrow">USER MANAGEMENT</p>
                        <h1>Danh sách khách hàng</h1>
                        <p>Quản lý và tra cứu những tài khoản có vai trò Customer.</p>
                    </div>
                    <button className="admin-refresh" type="button" onClick={loadCustomers} disabled={loading}>
                        <span aria-hidden="true">↻</span>
                        {loading ? "Đang tải..." : "Làm mới"}
                    </button>
                </section>

                {/* Thẻ thống kê tổng quan (BL-031) */}
                <section className="admin-summary" aria-label="Thống kê khách hàng">
                    <article>
                        <span>Tổng khách hàng</span>
                        <strong>{customers.length}</strong>
                        <small>Tài khoản Customer</small>
                    </article>
                    <article>
                        <span>Đang hoạt động</span>
                        <strong>{customers.filter((customer) => customer.status === "ACTIVE").length}</strong>
                        <small>Tài khoản khả dụng</small>
                    </article>
                    <article>
                        <span>Kết quả hiển thị</span>
                        <strong>{filteredCustomers.length}</strong>
                        <small>Theo bộ lọc hiện tại</small>
                    </article>
                </section>

                {/* Bảng dữ liệu và thanh tìm kiếm, lọc (BL-031) */}
                <section className="admin-users-card">
                    <div className="admin-toolbar">
                        <label className="admin-search">
                            <span aria-hidden="true">⌕</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm theo tên, username, email hoặc số điện thoại"
                                aria-label="Tìm kiếm khách hàng"
                            />
                        </label>
                        <label className="admin-filter">
                            <span>Trạng thái</span>
                            <select value={status} onChange={(event) => setStatus(event.target.value)}>
                                <option value="ALL">Tất cả</option>
                                {statuses.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {actionError && (
                        <div className="admin-action-error" role="alert">
                            <span>{actionError}</span>
                            <button type="button" onClick={() => setActionError("")} aria-label="Đóng thông báo">×</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="admin-state">
                            <div className="admin-spinner"/>
                            <p>Đang tải danh sách khách hàng...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-state admin-state-error">
                            <strong>Không thể tải dữ liệu</strong>
                            <p>{error}</p>
                            <button type="button" onClick={loadCustomers}>Thử lại</button>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="admin-state">
                            <strong>Không tìm thấy khách hàng</strong>
                            <p>Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Liên hệ</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="admin-customer-cell">
                                                <span className="admin-customer-avatar">
                                                    {(customer.fullName || customer.username || "U").trim().charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <strong>{customer.fullName || "Chưa cập nhật tên"}</strong>
                                                    <small>@{customer.username}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-contact-cell">
                                                <span>{customer.email}</span>
                                                <small>{customer.phone || "Chưa có số điện thoại"}</small>
                                            </div>
                                        </td>
                                        <td><span className="admin-role-badge">{customer.role}</span></td>
                                        <td>
                                            <span className={`admin-status admin-status-${normalize(customer.status)}`}>
                                                <i/>{customer.status}
                                            </span>
                                        </td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    type="button"
                                                    className="admin-action-edit"
                                                    disabled={pendingAction?.id === customer.id}
                                                    onClick={() => handleOpenEdit(customer)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-action-lock"
                                                    disabled={customer.status === "BANNED" || pendingAction?.id === customer.id}
                                                    onClick={() => handleLock(customer)}
                                                >
                                                    {pendingAction?.id === customer.id && pendingAction.type === "lock"
                                                        ? "Đang khóa..."
                                                        : customer.status === "BANNED" ? "Đã khóa" : "Khóa"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-action-delete"
                                                    disabled={pendingAction?.id === customer.id}
                                                    onClick={() => handleDelete(customer)}
                                                >
                                                    {pendingAction?.id === customer.id && pendingAction.type === "delete"
                                                        ? "Đang xóa..."
                                                        : "Xóa"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal cập nhật thông tin tài khoản (BL-034) */}
            {editingCustomer && (
                <div className="admin-modal-backdrop" onClick={handleCloseEdit}>
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-labelledby="edit-user-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-modal-header">
                            <h2 id="edit-user-title">Cập nhật thông tin tài khoản</h2>
                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={handleCloseEdit}
                                aria-label="Đóng"
                                disabled={editSaving}
                            >
                                ×
                            </button>
                        </div>

                        <form className="admin-modal-form" onSubmit={handleSaveEdit}>
                            {editError && (
                                <div className="admin-modal-error" role="alert">
                                    {editError}
                                </div>
                            )}

                            <div className="admin-form-group">
                                <label htmlFor="edit-username">Tên đăng nhập (Username)</label>
                                <input
                                    id="edit-username"
                                    type="text"
                                    value={editingCustomer.username}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="edit-fullname">Họ và tên</label>
                                <input
                                    id="edit-fullname"
                                    name="fullName"
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={handleEditChange}
                                    placeholder="Nhập họ và tên"
                                    maxLength={100}
                                    disabled={editSaving}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="edit-email">Email *</label>
                                <input
                                    id="edit-email"
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    placeholder="example@domain.com"
                                    maxLength={100}
                                    required
                                    disabled={editSaving}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="edit-phone">Số điện thoại</label>
                                <input
                                    id="edit-phone"
                                    name="phone"
                                    type="text"
                                    value={editForm.phone}
                                    onChange={handleEditChange}
                                    placeholder="0912345678"
                                    disabled={editSaving}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="edit-status">Trạng thái *</label>
                                <select
                                    id="edit-status"
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleEditChange}
                                    disabled={editSaving}
                                >
                                    <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                                    <option value="INACTIVE">INACTIVE (Chưa kích hoạt)</option>
                                    <option value="BANNED">BANNED (Đã khóa)</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="edit-role">Vai trò *</label>
                                <select
                                    id="edit-role"
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditChange}
                                    disabled={editSaving}
                                >
                                    <option value="CUSTOMER">CUSTOMER</option>
                                    <option value="STAFF">STAFF</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>

                            <div className="admin-modal-actions">
                                <button
                                    type="button"
                                    className="admin-modal-btn-cancel"
                                    onClick={handleCloseEdit}
                                    disabled={editSaving}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="admin-modal-btn-submit"
                                    disabled={editSaving}
                                >
                                    {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

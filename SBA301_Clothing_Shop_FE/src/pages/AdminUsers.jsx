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
     * BL-031: Hàm tải danh sách khách hàng từ backend thông qua API getCustomers().
     * Thiết lập trạng thái loading và bắt lỗi chi tiết nếu có.
     */
    async function loadCustomers() {
        // Bật cờ trạng thái đang tải dữ liệu
        setLoading(true);
        // Xóa thông báo lỗi cũ
        setError("");

        try {
            // Gọi hàm getCustomers() gửi request GET /api/users kèm token Admin
            const data = await getCustomers();
            // Cập nhật danh sách khách hàng vào state (đảm bảo luôn là mảng)
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            // Hiển thị thông báo lỗi nếu API gặp sự cố
            setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
        } finally {
            // Tắt cờ trạng thái đang tải dữ liệu
            setLoading(false);
        }
    }

    /**
     * BL-031: Hook chạy 1 lần khi trang được nạp để lấy dữ liệu ban đầu.
     */
    useEffect(() => {
        let active = true;

        // Gọi API nạp danh sách khách hàng
        getCustomers()
            .then((data) => {
                // Nếu component vẫn active thì nạp dữ liệu vào state
                if (active) setCustomers(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                // Nếu có lỗi, ghi nhận thông báo lỗi
                if (active) setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
            })
            .finally(() => {
                // Tắt trạng thái loading khi hoàn tất
                if (active) setLoading(false);
            });

        // Cleanup: Hủy cờ active khi component bị unmount
        return () => {
            active = false;
        };
    }, []);

    /**
     * BL-031: Trích xuất danh sách các trạng thái duy nhất có trong dữ liệu khách hàng.
     */
    const statuses = useMemo(
        // Lấy các giá trị trạng thái không trùng lặp và loại bỏ giá trị rỗng/null
        () => [...new Set(customers.map((customer) => customer.status).filter(Boolean))],
        [customers]
    );

    /**
     * BL-031: Lọc danh sách khách hàng dựa trên từ khóa tìm kiếm và trạng thái đang chọn.
     */
    const filteredCustomers = useMemo(() => {
        // Chuẩn hóa từ khóa tìm kiếm (loại bỏ khoảng trắng, đổi thành chữ thường)
        const keyword = normalize(search.trim());

        // Lọc từng khách hàng trong danh sách
        return customers.filter((customer) => {
            // Kiểm tra trạng thái: nếu chọn 'ALL' hoặc trùng khớp trạng thái thì thỏa mãn
            const matchesStatus = status === "ALL" || customer.status === status;
            // Kiểm tra từ khóa: nếu không nhập từ khóa hoặc tên/username/email/phone chứa từ khóa
            const matchesSearch = !keyword || [
                customer.fullName,
                customer.username,
                customer.email,
                customer.phone,
            ].some((value) => normalize(value).includes(keyword));

            // Trả về true nếu thỏa mãn cả hai điều kiện
            return matchesStatus && matchesSearch;
        });
    }, [customers, search, status]);

    /**
     * BL-032: Khóa tài khoản khách hàng sau khi xác nhận hộp thoại confirm.
     * Gửi yêu cầu PATCH /api/users/{id}/lock lên server.
     */
    async function handleLock(customer) {
        // 1. Hiển thị hộp thoại xác nhận của trình duyệt
        const confirmed = window.confirm(
            `Khóa tài khoản “${customer.username}”? Tài khoản này sẽ bị hạn chế sử dụng hệ thống.`
        );

        // 2. Nếu người dùng chọn Hủy (Cancel) thì dừng thao tác
        if (!confirmed) return;

        // 3. Đánh dấu thao tác đang thực thi trên ID này để vô hiệu hóa nút bấm
        setPendingAction({id: customer.id, type: "lock"});
        // 4. Xóa lỗi thao tác trước đó
        setActionError("");

        try {
            // 5. Gửi request PATCH tới server để cập nhật status = BANNED
            const updatedCustomer = await lockCustomer(customer.id);
            // 6. Cập nhật đối tượng khách hàng mới trực tiếp vào state mà không cần nạp lại trang
            setCustomers((current) => current.map((item) =>
                item.id === updatedCustomer.id ? updatedCustomer : item
            ));
        } catch (err) {
            // 7. Ghi nhận thông báo lỗi nếu có
            setActionError(err.message || "Không thể khóa tài khoản.");
        } finally {
            // 8. Đặt lại trạng thái pendingAction về null khi hoàn tất
            setPendingAction(null);
        }
    }

    /**
     * BL-033: Xóa vĩnh viễn tài khoản khách hàng sau khi xác nhận hộp thoại confirm.
     * Gửi yêu cầu DELETE /api/users/{id} lên server.
     */
    async function handleDelete(customer) {
        // 1. Hiển thị cảnh báo xác nhận xóa vĩnh viễn
        const confirmed = window.confirm(
            `Xóa vĩnh viễn tài khoản “${customer.username}”? Thao tác này không thể hoàn tác.`
        );

        // 2. Nếu người dùng không đồng ý thì thoát
        if (!confirmed) return;

        // 3. Đánh dấu thao tác đang thực thi
        setPendingAction({id: customer.id, type: "delete"});
        // 4. Xóa lỗi thao tác cũ
        setActionError("");

        try {
            // 5. Gọi API DELETE /api/users/{id}
            await deleteCustomer(customer.id);
            // 6. Lọc bỏ khách hàng đã bị xóa ra khỏi mảng state hiện tại
            setCustomers((current) => current.filter((item) => item.id !== customer.id));
        } catch (err) {
            // 7. Bắt lỗi (ví dụ khách hàng đã có đơn hàng -> server báo 409 Conflict)
            setActionError(err.message || "Không thể xóa tài khoản.");
        } finally {
            // 8. Reset trạng thái pendingAction
            setPendingAction(null);
        }
    }


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
        // Ngăn chặn hành vi reload trang mặc định của form HTML
        e.preventDefault();
        // Xóa thông báo lỗi cũ
        setEditError("");

        // Cắt bỏ khoảng trắng dư thừa
        const trimmedFullName = editForm.fullName.trim();
        const trimmedEmail = editForm.email.trim();
        const trimmedPhone = editForm.phone.trim();

        // 1. Kiểm tra trường email bắt buộc
        if (!trimmedEmail) {
            setEditError("Email không được để trống.");
            return;
        }

        // 2. Kiểm tra định dạng email và độ dài tối đa 100 ký tự
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 100) {
            setEditError("Email không đúng định dạng hoặc vượt quá 100 ký tự.");
            return;
        }

        // 3. Kiểm tra giới hạn độ dài họ và tên (tối đa 100 ký tự)
        if (trimmedFullName.length > 100) {
            setEditError("Họ và tên không được vượt quá 100 ký tự.");
            return;
        }

        // 4. Kiểm tra định dạng số điện thoại nếu người dùng có nhập (9-15 chữ số)
        if (trimmedPhone) {
            const phoneRegex = /^\+?[0-9]{9,15}$/;
            if (!phoneRegex.test(trimmedPhone)) {
                setEditError("Số điện thoại không hợp lệ (phải từ 9-15 chữ số, có thể bắt đầu bằng +).");
                return;
            }
        }

        // 5. Bật cờ trạng thái đang lưu dữ liệu
        setEditSaving(true);
        try {
            // 6. Đóng gói payload gửi lên server
            const payload = {
                fullName: trimmedFullName,
                email: trimmedEmail,
                phone: trimmedPhone,
                status: editForm.status,
                role: editForm.role,
            };
            // 7. Gọi hàm updateCustomer gửi request PUT /api/users/{id}
            const updated = await updateCustomer(editingCustomer.id, payload);
            // 8. Cập nhật lại đối tượng trong state customers mà không cần tải lại toàn bộ trang
            setCustomers((current) =>
                current.map((item) => (item.id === updated.id ? updated : item))
            );
            // 9. Đóng modal chỉnh sửa
            setEditingCustomer(null);
        } catch (err) {
            // 10. Ghi nhận lỗi nếu server trả về lỗi (ví dụ trùng email)
            setEditError(err.message || "Không thể cập nhật thông tin tài khoản.");
        } finally {
            // 11. Tắt cờ trạng thái lưu
            setEditSaving(false);
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

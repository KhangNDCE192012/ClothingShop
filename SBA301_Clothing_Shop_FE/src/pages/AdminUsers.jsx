import {useEffect, useMemo, useState} from "react";
import {deleteCustomer, getCustomers, lockCustomer} from "../services/UserService";
import "../css/AdminUsers.css";

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

const normalize = (value) => String(value ?? "").toLocaleLowerCase("vi");

export default function AdminUsers() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [pendingAction, setPendingAction] = useState(null);

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

    const statuses = useMemo(
        () => [...new Set(customers.map((customer) => customer.status).filter(Boolean))],
        [customers]
    );

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

    async function handleDelete(customer) {
        const confirmed = window.confirm(
            `Xóa vĩnh viễn tài khoản “${customer.username}”? Thao tác này không thể hoàn tác.`
        );

        if (!confirmed) return;

        setPendingAction({id: customer.id, type: "delete"});
        setActionError("");

        try {
            await deleteCustomer(customer.id);
            setCustomers((current) => current.filter((item) => item.id !== customer.id));
        } catch (err) {
            setActionError(err.message || "Không thể xóa tài khoản.");
        } finally {
            setPendingAction(null);
        }
    }

    return (
        <main className="admin-users-page">
            <header className="admin-topbar">
                <div className="admin-brand">
                    <span className="admin-brand-mark">CS</span>
                    <div>
                        <strong>Clothing Shop</strong>
                        <small>Admin workspace</small>
                    </div>
                </div>
                <div className="admin-profile">
                    <span>Quản trị viên</span>
                    <div className="admin-avatar">A</div>
                </div>
            </header>

            <div className="admin-content">
                <section className="admin-page-heading">
                    <div>
                        <p className="admin-eyebrow">BL-031 · USER MANAGEMENT</p>
                        <h1>Danh sách khách hàng</h1>
                        <p>Quản lý và tra cứu những tài khoản có vai trò Customer.</p>
                    </div>
                    <button className="admin-refresh" type="button" onClick={loadCustomers} disabled={loading}>
                        <span aria-hidden="true">↻</span>
                        {loading ? "Đang tải..." : "Làm mới"}
                    </button>
                </section>

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
        </main>
    );
}

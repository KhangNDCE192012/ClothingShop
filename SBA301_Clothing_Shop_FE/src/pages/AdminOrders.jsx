
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllOrders } from "../services/OrderService";
import { useNavigate } from "react-router-dom";
import "../css/AdminOrders.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(price) || 0);

const getOrderId = (order) => order.id ?? order.orderId;

const getCustomerName = (order) =>
    order.user?.fullName ??
    order.user?.username ??
    order.customerName ??
    order.recipientName ??
    "Khách hàng";

const getTotal = (order) =>
    order.totalAmount ??
    order.totalPrice ??
    order.total ??
    0;

const getStatus = (order) =>
    String(order.status ?? "PENDING").toUpperCase();

const statusLabels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PAID: "Đã thanh toán",
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        async function loadOrders() {
            try {
                setLoading(true);
                setError("");

                const data = await getAllOrders();

                if (!cancelled) {
                    setOrders(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Không thể tải danh sách đơn hàng."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadOrders();

        return () => {
            cancelled = true;
        };
    }, []);


    const filteredOrders = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return orders.filter((order) => {
            const id = String(getOrderId(order) ?? "");
            const customer = getCustomerName(order).toLowerCase();
            const status = getStatus(order);

            const matchesKeyword =
                id.toLowerCase().includes(normalizedKeyword) ||
                customer.includes(normalizedKeyword);

            const matchesStatus =
                statusFilter === "ALL" || status === statusFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [orders, keyword, statusFilter]);

    const totalRevenue = filteredOrders.reduce(
        (sum, order) => sum + Number(getTotal(order) || 0),
        0
    );

    return (
        <main className="admin-orders-page">
            <div className="admin-orders-container">
                <nav className="admin-orders-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <strong>Quản lý đơn hàng</strong>
                </nav>

                <header className="admin-orders-heading">
                    <div>
                        <span className="admin-orders-eyebrow">
                            ADMINISTRATION
                        </span>
                        <h1>Quản lý đơn hàng</h1>
                        <p>
                            Theo dõi và quản lý các đơn hàng của khách hàng.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-orders-refresh"
                        onClick={() => window.location.reload()}
                    >
                        ↻ Làm mới
                    </button>
                </header>

                <section className="admin-orders-stats">
                    <article className="admin-orders-stat">
                        <span>Tổng đơn hàng phù hợp</span>
                        <strong>{filteredOrders.length}</strong>
                    </article>

                    <article className="admin-orders-stat">
                        <span>Đơn đang chờ xử lý</span>
                        <strong>
                            {
                                filteredOrders.filter(
                                    (order) =>
                                        getStatus(order) === "PENDING"
                                ).length
                            }
                        </strong>
                    </article>

                    <article className="admin-orders-stat">
                        <span>Tổng giá trị đơn hàng đang lọc</span>
                        <strong>{formatPrice(totalRevenue)}</strong>
                    </article>
                </section>

                <section className="admin-orders-panel">
                    <div className="admin-orders-toolbar">
                        <input
                            type="search"
                            value={keyword}
                            onChange={(event) =>
                                setKeyword(event.target.value)
                            }
                            placeholder="Tìm mã đơn hoặc tên khách hàng..."
                            aria-label="Tìm đơn hàng"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label="Lọc trạng thái đơn hàng"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            {Object.entries(statusLabels).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {loading ? (
                        <div className="admin-orders-message">
                            Đang tải danh sách đơn hàng...
                        </div>
                    ) : error ? (
                        <div className="admin-orders-message error">
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="admin-orders-message">
                            Không tìm thấy đơn hàng phù hợp.
                        </div>
                    ) : (
                        <div className="admin-orders-table-wrapper">
                            <table className="admin-orders-table">
                                <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Ngày đặt</th>
                                    <th>Thanh toán</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredOrders.map((order, index) => {
                                    const id = getOrderId(order);
                                    const status = getStatus(order);
                                    const date =
                                        order.createdAt ??
                                        order.orderDate ??
                                        order.created_at;

                                    return (
                                        <tr
                                            key={id ?? index}
                                            className="admin-order-row"
                                            onClick={() => navigate(`/admin/orders/${id}`)}
                                            title={`Xem chi tiết đơn hàng #${id}`}
                                        >
                                            <td className="order-code">
                                                #{id ?? "—"}
                                            </td>

                                            <td>
                                                <strong>
                                                    {getCustomerName(order)}
                                                </strong>
                                            </td>

                                            <td>
                                                {date
                                                    ? new Date(
                                                        date
                                                    ).toLocaleString(
                                                        "vi-VN"
                                                    )
                                                    : "—"}
                                            </td>

                                            <td>
                                                {order.paymentMethod ??
                                                    "—"}
                                            </td>

                                            <td className="order-price">
                                                {formatPrice(getTotal(order))}
                                            </td>

                                            <td>
                                                    <span
                                                        className={`order-status status-${status.toLowerCase()}`}
                                                    >
                                                        {statusLabels[status] ??
                                                            status}
                                                    </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && !error && (
                        <footer className="admin-orders-footer">
                            Hiển thị {filteredOrders.length} / {orders.length}{" "}
                            đơn hàng
                        </footer>
                    )}
                </section>
            </div>
        </main>
    );
}


import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
} from "../services/OrderService";
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
    order.totalAmount ?? order.totalPrice ?? order.total ?? 0;

const getStatus = (order) =>
    String(order.status ?? "PENDING").toUpperCase();

const editableStatuses = [
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "SHIPPING", label: "Shipping" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [updatingIds, setUpdatingIds] = useState([]);
    const [updateMessage, setUpdateMessage] = useState("");
    const [updateError, setUpdateError] = useState("");

    const navigate = useNavigate();


    async function loadOrders() {
        setLoading(true);
        setError("");

        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (err) {
            setError(
                err.message || "Không thể tải danh sách đơn hàng."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        getAllOrders()
            .then((data) => {
                if (!cancelled) {
                    setOrders(data);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err.message || "Không thể tải danh sách đơn hàng."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);


    const filteredOrders = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return orders.filter((order) => {
            const id = String(getOrderId(order) ?? "");
            const customer = String(getCustomerName(order)).toLowerCase();
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

    async function handleStatusChange(orderId, newStatus) {
        if (orderId == null) return;

        const idKey = String(orderId);

        const currentOrder = orders.find(
            (order) => String(getOrderId(order)) === idKey
        );

        if (
            !currentOrder ||
            getStatus(currentOrder) === newStatus ||
            updatingIds.includes(idKey)
        ) {
            return;
        }

        const oldStatus = getStatus(currentOrder);

        setUpdatingIds((previous) => [...previous, idKey]);
        setUpdateMessage("");
        setUpdateError("");

        try {
            await updateOrderStatus(orderId, newStatus);

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    String(getOrderId(order)) === idKey
                        ? { ...order, status: newStatus }
                        : order
                )
            );

            const label =
                editableStatuses.find(
                    (item) => item.value === newStatus
                )?.label ?? newStatus;

            setUpdateMessage(
                `Đã cập nhật đơn hàng #${orderId} thành ${label}.`
            );
        } catch (err) {
            setUpdateError(
                err.message || "Không thể cập nhật trạng thái đơn hàng."
            );

            // Không thay đổi orders khi API thất bại.
            // Dropdown sẽ trở về trạng thái đang lưu.
            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    String(getOrderId(order)) === idKey
                        ? { ...order, status: oldStatus }
                        : order
                )
            );
        } finally {
            setUpdatingIds((previous) =>
                previous.filter((value) => value !== idKey)
            );
        }
    }

    async function handleDeleteOrder(orderId) {
        if (orderId == null) return;

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa đơn hàng #${orderId}? Đơn hàng sẽ được ẩn khỏi danh sách nhưng không bị xóa khỏi database.`
        );

        if (!confirmed) return;

        const idKey = String(orderId);

        if (updatingIds.includes(idKey)) return;

        setUpdatingIds((previous) => [...previous, idKey]);
        setUpdateMessage("");
        setUpdateError("");

        try {
            await deleteOrder(orderId);

            // Ẩn đơn hàng khỏi danh sách sau khi backend cập nhật thành công.
            setOrders((previousOrders) =>
                previousOrders.filter(
                    (order) =>
                        String(getOrderId(order)) !== idKey
                )
            );

            setUpdateMessage(
                `Đã xóa mềm đơn hàng #${orderId}.`
            );
        } catch (err) {
            setUpdateError(
                err.message || "Không thể xóa đơn hàng."
            );
        } finally {
            setUpdatingIds((previous) =>
                previous.filter((value) => value !== idKey)
            );
        }
    }


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
                            Theo dõi và cập nhật trạng thái đơn hàng của khách hàng.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-orders-refresh"
                        onClick={loadOrders}
                        disabled={loading}
                    >
                        ↻ {loading ? "Đang tải..." : "Làm mới"}
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

                            {editableStatuses.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {updateMessage && (
                        <p className="order-update-success" role="status">
                            {updateMessage}
                        </p>
                    )}

                    {updateError && (
                        <p className="order-update-error" role="alert">
                            {updateError}
                        </p>
                    )}

                    {loading ? (
                        <div className="admin-orders-message">
                            Đang tải danh sách đơn hàng...
                        </div>
                    ) : error ? (
                        <div className="admin-orders-message error">
                            <p>{error}</p>

                            <button type="button" onClick={loadOrders}>
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
                                    <th>Thao tác</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredOrders.map((order, index) => {
                                    const id = getOrderId(order);
                                    const status = getStatus(order);
                                    const idKey = String(id);
                                    const isUpdating =
                                        updatingIds.includes(idKey);

                                    const date =
                                        order.createdAt ??
                                        order.orderDate ??
                                        order.created_at;

                                    return (
                                        <tr
                                            key={id ?? index}
                                            className="admin-order-row"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/orders/${id}`
                                                )
                                            }
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
                                                {order.paymentMethod ?? "—"}
                                            </td>

                                            <td className="order-price">
                                                {formatPrice(getTotal(order))}
                                            </td>

                                            <td>
                                                <select
                                                    className={`order-status-select status-${status.toLowerCase()}`}
                                                    value={editableStatuses.some(
                                                        (item) =>
                                                            item.value === status
                                                    )
                                                        ? status
                                                        : "PENDING"
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        id == null
                                                    }
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    onChange={(event) => {
                                                        event.stopPropagation();

                                                        handleStatusChange(
                                                            id,
                                                            event.target.value
                                                        );
                                                    }}
                                                    onKeyDown={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    aria-label={`Cập nhật trạng thái đơn hàng ${id}`}
                                                >
                                                    {editableStatuses.map(
                                                        (item) => (
                                                            <option
                                                                key={item.value}
                                                                value={item.value}
                                                            >
                                                                {item.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {isUpdating && (
                                                    <small className="order-status-loading">
                                                        Đang cập nhật...
                                                    </small>
                                                )}
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="order-delete-button"
                                                    disabled={isUpdating || id == null}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDeleteOrder(id);
                                                    }}
                                                >
                                                    {isUpdating ? "Đang xử lý..." : "Xóa"}
                                                </button>
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

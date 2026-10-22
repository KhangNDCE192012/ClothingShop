
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../services/OrderService";
import "../css/AdminOrderDetail.css";

const formatMoney = (value) =>
    Number(value ?? 0).toLocaleString("vi-VN") + " ₫";

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("vi-VN");
};

const statusLabels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    SHIPPING: "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PAID: "Đã thanh toán",
};

function getItems(order) {
    const candidates = [
        order?.orderDetails,
        order?.details,
        order?.items,
        order?.data?.orderDetails,
        order?.data?.details,
    ];

    return candidates.find(Array.isArray) ?? [];
}

function getVariant(item) {
    return item?.variant ?? item?.productVariant ?? {};
}

function getProductName(item, variant) {
    return (
        variant?.product?.name ??
        variant?.product?.productName ??
        item?.productName ??
        item?.product?.name ??
        "—"
    );
}

function getVariantId(item, variant) {
    return (
        variant?.id ??
        variant?.variantId ??
        item?.variantId ??
        item?.variant?.id ??
        "—"
    );
}

function getSize(item, variant) {
    const size = variant?.size ?? item?.size;

    if (typeof size === "string" || typeof size === "number") {
        return size;
    }

    return size?.sizeName ?? size?.name ?? item?.sizeName ?? "—";
}

function getColor(item, variant) {
    const color = variant?.color ?? item?.color;

    if (typeof color === "string" || typeof color === "number") {
        return color;
    }

    return color?.colorName ?? color?.name ?? item?.colorName ?? "—";
}

function getItemPrice(item, variant) {
    return Number(
        item?.price ??
        item?.unitPrice ??
        variant?.price ??
        0
    );
}

function AdminOrderDetail() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadOrder() {
            setLoading(true);
            setError("");
            setOrder(null);

            try {

                const data = await getOrderById(id);

                console.log("ORDER API RESPONSE:", data);

                let result;

// API trả về mảng OrderDetail, mỗi phần tử có thuộc tính order.
                if (Array.isArray(data)) {
                    if (data.length === 0) {
                        throw new Error("Đơn hàng chưa có dữ liệu chi tiết.");
                    }

                    result = {
                        ...data[0].order,
                        orderDetails: data,
                    };
                } else {
                    // API trả về một object đơn hàng.
                    result =
                        data?.order ??
                        data?.data?.order ??
                        data?.data ??
                        data;
                }

                if (!result || typeof result !== "object") {
                    throw new Error("Dữ liệu đơn hàng không hợp lệ.");
                }

                if (!cancelled) {
                    setOrder(result);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Không thể tải thông tin đơn hàng."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadOrder();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <main className="admin-order-detail-page">
                <p>Đang tải thông tin đơn hàng...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="admin-order-detail-page">
                <Link
                    to="/admin/orders"
                    className="order-detail-back"
                >
                    ← Quay lại danh sách đơn hàng
                </Link>

                <p className="order-detail-error">{error}</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="admin-order-detail-page">
                <p>Không tìm thấy đơn hàng.</p>
            </main>
        );
    }

    const orderId = order.id ?? order.orderId ?? id;
    const items = getItems(order);

    const status = String(order.status ?? "UNKNOWN").toUpperCase();

    const subtotal = items.reduce((sum, item) => {
        const variant = getVariant(item);
        const price = getItemPrice(item, variant);
        const quantity = Number(item?.quantity ?? 0);

        return sum + price * quantity;
    }, 0);

    const shippingFee = Number(order.shippingFee ?? 0);

    // Ưu tiên tổng tiền do backend lưu.
    // Nếu backend không trả tổng tiền thì tính từ sản phẩm và phí ship.
    const totalPrice =
        order.totalPrice ??
        order.totalAmount ??
        order.total ??
        subtotal + shippingFee;

    return (
        <main className="admin-order-detail-page">
            <Link
                to="/admin/orders"
                className="order-detail-back"
            >
                ← Quay lại danh sách đơn hàng
            </Link>

            <header className="order-detail-header">
                <div>
                    <h1>Chi tiết đơn hàng #{orderId}</h1>

                    <p>
                        Ngày đặt:{" "}
                        {formatDate(order.orderDate ?? order.createdAt)}
                    </p>
                </div>

                <span
                    className={`order-detail-status status--${status.toLowerCase()}`}
                >
                    {statusLabels[status] ?? status}
                </span>
            </header>

            <section className="order-detail-card">
                <h2>Thông tin nhận hàng</h2>

                <div className="order-detail-grid">
                    <div>
                        <span>Người nhận</span>
                        <strong>
                            {order.recipientName ??
                                order.user?.fullName ??
                                order.user?.username ??
                                "—"}
                        </strong>
                    </div>

                    <div>
                        <span>Số điện thoại</span>
                        <strong>{order.recipientPhone ?? "—"}</strong>
                    </div>

                    <div>
                        <span>Email</span>
                        <strong>{order.recipientEmail ?? "—"}</strong>
                    </div>

                    <div>
                        <span>Địa chỉ giao hàng</span>
                        <strong>{order.shippingAddress ?? "—"}</strong>
                    </div>

                    <div>
                        <span>Phương thức thanh toán</span>
                        <strong>{order.paymentMethod ?? "—"}</strong>
                    </div>

                    <div>
                        <span>Ghi chú</span>
                        <strong>
                            {order.note || "Không có ghi chú"}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="order-detail-card">
                <h2>Sản phẩm đã đặt</h2>

                <div className="order-detail-table-wrapper">
                    <table className="order-detail-table">
                        <thead>
                        <tr>
                            <th>Variant ID</th>
                            <th>Sản phẩm</th>
                            <th>Size</th>
                            <th>Màu sắc</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                        </thead>

                        <tbody>
                        {items.map((item, index) => {
                            const variant = getVariant(item);
                            const price = getItemPrice(item, variant);
                            const quantity = Number(item.quantity ?? 0);

                            return (
                                <tr key={item.id ?? index}>
                                    <td>
                                        {getVariantId(item, variant)}
                                    </td>

                                    <td>
                                        {getProductName(item, variant)}
                                    </td>

                                    <td>{getSize(item, variant)}</td>

                                    <td>{getColor(item, variant)}</td>

                                    <td>{formatMoney(price)}</td>

                                    <td>{quantity}</td>

                                    <td className="order-detail-price">
                                        {formatMoney(price * quantity)}
                                    </td>
                                </tr>
                            );
                        })}

                        {items.length === 0 && (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="order-detail-empty"
                                >
                                    Đơn hàng chưa có dữ liệu chi tiết.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="order-detail-total">
                    <p>
                        Tiền hàng:{" "}
                        <strong>{formatMoney(subtotal)}</strong>
                    </p>

                    <p>
                        Phí vận chuyển:{" "}
                        <strong>{formatMoney(shippingFee)}</strong>
                    </p>

                    <p className="order-detail-grand-total">
                        Tổng thanh toán:{" "}
                        <strong>{formatMoney(totalPrice)}</strong>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default AdminOrderDetail;

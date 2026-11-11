
/**
 * Component gốc của ứng dụng Frontend SBA301 Clothing Shop.
 * Định tuyến toàn bộ các trang công khai (Home, ProductDetail, Cart, Checkout, Login, Register)
 * và các trang quản trị được bảo vệ bởi ProtectedRoute (AdminProducts, AdminProductCreate, AdminUsers, AdminOrders, AdminOrderDetail).
 */
import { Navigate, Route, Routes } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import AdminUsers from "./pages/AdminUsers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthHeader from "./components/AuthHeader";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminProductCreate from "./pages/AdminProductCreate";
import CategoryProducts from "./pages/CategoryProducts";
import "./css/AdminTheme.css";

/*
 * Nguyen Duy Khang
 * Khai báo các trang công khai và trang quản trị của ứng dụng.
 */
function App() {
  return (
    <>
      <AuthHeader />
      <Routes>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories/:id" element={<CategoryProducts />} />
          <Route
              path="/admin/products/:id/edit"
              element={(
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminProductCreate />
                  </ProtectedRoute>
              )}
          />
          <Route
              path="/admin/products/new"
              element={(
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminProductCreate />
                  </ProtectedRoute>
              )}
          />
          <Route
              path="/admin/products"
              element={(
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminProducts />
                  </ProtectedRoute>
              )}
          />
          <Route
              path="/admin/users"
              element={(
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminUsers />
                </ProtectedRoute>
              )}
          />
          <Route
              path="/admin/orders"
              element={(
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminOrders />
                  </ProtectedRoute>
              )}
          />
          <Route
              path="/admin/orders/:id"
              element={(
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminOrderDetail />
                  </ProtectedRoute>
              )}
          />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

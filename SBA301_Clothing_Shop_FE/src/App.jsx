
import { Navigate, Route, Routes } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import AdminUsers from "./pages/AdminUsers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthHeader from "./components/AuthHeader";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";

function App() {
  return (
    <>
      <AuthHeader />
      <Routes>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products/:id" element={<ProductDetail />} />
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

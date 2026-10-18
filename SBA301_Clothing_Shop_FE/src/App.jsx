
import { Navigate, Route, Routes } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import AdminUsers from "./pages/AdminUsers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import AuthHeader from "./components/AuthHeader";

function App() {
  return (
    <>
      <AuthHeader />
      <Routes>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

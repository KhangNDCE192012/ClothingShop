
import { Routes, Route } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import AdminUsers from "./pages/AdminUsers";
import Home from "./pages/Home";

function App() {
  return (
      <Routes>
        {/* Các route khác của project đặt ở đây */}
          <Route path="/" element={<Home />} />

        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
  );
}

export default App;

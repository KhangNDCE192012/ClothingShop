
import { Routes, Route } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";

function App() {
  return (
      <Routes>
        {/* Các route khác của project đặt ở đây */}
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
  );
}

export default App;

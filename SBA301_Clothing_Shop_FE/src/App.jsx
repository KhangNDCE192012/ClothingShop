import { Routes, Route } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <div style={{ padding: "30px" }}>
                        <h1>Clothing Shop</h1>
                        <p>Frontend đang chạy thành công.</p>
                    </div>
                }
            />

            <Route
                path="/products/:id"
                element={<ProductDetail />}
            />
        </Routes>
    );
}

export default App;
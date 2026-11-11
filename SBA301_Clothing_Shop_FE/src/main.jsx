/**
 * Điểm khởi chạy của ứng dụng React Frontend (Vite).
 * Khởi tạo React Root, thiết lập BrowserRouter và bọc toàn bộ component bên trong AuthProvider.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "./auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);

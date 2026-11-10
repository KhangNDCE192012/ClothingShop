import axios from "axios";
import {getAccessToken} from "./AuthService";

/*
 * Gọi API đọc và quản lý Category trong module Product BL-012.
 */

const CATEGORY_API =
    "http://localhost:8080/api/categories";

export const getCategories = async () => {
    const response = await axios.get(CATEGORY_API);

    return response.data;
};

function adminConfig() {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    return {headers: {Authorization: `Bearer ${token}`}};
}

function categoryError(error, fallback) {
    return new Error(error.response?.data?.message || fallback);
}

export async function createCategory(name) {
    try {
        const response = await axios.post(CATEGORY_API, {name}, adminConfig());
        return response.data;
    } catch (error) {
        throw categoryError(error, "Không thể tạo danh mục");
    }
}

export async function updateCategory(categoryId, name) {
    try {
        const response = await axios.put(`${CATEGORY_API}/${categoryId}`, {name}, adminConfig());
        return response.data;
    } catch (error) {
        throw categoryError(error, "Không thể cập nhật danh mục");
    }
}

export async function deleteCategory(categoryId) {
    try {
        await axios.delete(`${CATEGORY_API}/${categoryId}`, adminConfig());
    } catch (error) {
        throw categoryError(error, "Không thể xóa danh mục");
    }
}

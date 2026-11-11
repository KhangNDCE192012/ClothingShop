import axios from "axios";
import {getAccessToken} from "./AuthService";

/**
 * Service gọi API quản lý danh mục sản phẩm (BL-003, BL-004, BL-012).
 * Hỗ trợ lấy danh sách, thêm, sửa và xóa danh mục.
 */

const CATEGORY_API = "http://localhost:8080/api/categories";

/**
 * BL-003 & BL-004: Lấy danh sách toàn bộ danh mục sản phẩm (công khai).
 *
 * @returns {Promise<Array>} Danh sách danh mục CategoryResponse
 */
export const getCategories = async () => {
    const response = await axios.get(CATEGORY_API);
    return response.data;
};

/**
 * Tạo header Authorization đính kèm Bearer token cho các thao tác quản trị.
 */
function adminConfig() {
    const token = getAccessToken();
    if (!token) throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
    return {headers: {Authorization: `Bearer ${token}`}};
}

/**
 * Đọc thông báo lỗi từ backend hoặc trả về thông báo dự phòng.
 */
function categoryError(error, fallback) {
    return new Error(error.response?.data?.message || fallback);
}

/**
 * BL-012: Thêm danh mục sản phẩm mới (yêu cầu quyền Admin).
 *
 * @param {string} name Tên danh mục mới
 * @returns {Promise<Object>} Danh mục vừa tạo
 */
export async function createCategory(name) {
    try {
        const response = await axios.post(CATEGORY_API, {name}, adminConfig());
        return response.data;
    } catch (error) {
        throw categoryError(error, "Không thể tạo danh mục");
    }
}

/**
 * BL-012: Chỉnh sửa tên danh mục sản phẩm (yêu cầu quyền Admin).
 *
 * @param {number|string} categoryId Mã định danh danh mục
 * @param {string} name Tên danh mục mới
 * @returns {Promise<Object>} Danh mục sau khi cập nhật
 */
export async function updateCategory(categoryId, name) {
    try {
        const response = await axios.put(`${CATEGORY_API}/${categoryId}`, {name}, adminConfig());
        return response.data;
    } catch (error) {
        throw categoryError(error, "Không thể cập nhật danh mục");
    }
}

/**
 * BL-012: Xóa danh mục sản phẩm theo ID (yêu cầu quyền Admin).
 *
 * @param {number|string} categoryId Mã định danh danh mục cần xóa
 */
export async function deleteCategory(categoryId) {
    try {
        await axios.delete(`${CATEGORY_API}/${categoryId}`, adminConfig());
    } catch (error) {
        throw categoryError(error, "Không thể xóa danh mục");
    }
}

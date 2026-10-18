import axios from "axios";

const CATEGORY_API =
    "http://localhost:8080/api/categories";

export const getCategories = async () => {
    const response = await axios.get(CATEGORY_API);

    return response.data;
};
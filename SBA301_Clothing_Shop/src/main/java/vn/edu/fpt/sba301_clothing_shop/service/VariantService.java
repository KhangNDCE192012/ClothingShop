package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import java.util.List;

/**
 * Service xử lý truy vấn biến thể sản phẩm (Variant Service).
 * Hỗ trợ lấy thông tin size, color, giá và hình ảnh của từng biến thể.
 */
@Service
public class VariantService {

    @Autowired
    private VariantRepository variantRepository;

    /**
     * Lấy danh sách các biến thể theo Product ID.
     *
     * @param id Mã định danh sản phẩm
     * @return Danh sách VariantResponse
     */
    public List<VariantResponse> getVariantsByProductId(Integer id) {
        return variantRepository.findVariantsByProductId(id);
    }
}

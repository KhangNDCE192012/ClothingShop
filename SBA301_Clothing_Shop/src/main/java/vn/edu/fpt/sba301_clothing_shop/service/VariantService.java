package vn.edu.fpt.sba301_clothing_shop.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.fpt.sba301_clothing_shop.dto.response.VariantResponse;
import vn.edu.fpt.sba301_clothing_shop.repository.VariantRepository;

import java.util.List;

@Service
public class VariantService {

    @Autowired
    private VariantRepository variantRepository;


    public List<VariantResponse> getVariantsByProductId(Integer id) {
        return variantRepository.findVariantsByProductId(id);

    }
}

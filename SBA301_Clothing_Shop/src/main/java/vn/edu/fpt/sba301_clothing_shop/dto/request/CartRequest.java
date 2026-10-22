package vn.edu.fpt.sba301_clothing_shop.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartRequest(
        @NotNull
        Integer variantId,
        @NotNull
        @Min(1)
        Integer quantity)
{
}

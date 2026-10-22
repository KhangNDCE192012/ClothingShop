package vn.edu.fpt.sba301_clothing_shop.entity;

import java.io.Serializable;
import java.util.Objects;

public class CartId implements Serializable {

    private Integer user;
    private Integer variant;

    public CartId() {
    }

    public CartId(Integer user, Integer variant) {
        this.user = user;
        this.variant = variant;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CartId cartId)) return false;

        return Objects.equals(user, cartId.user)
                && Objects.equals(variant, cartId.variant);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, variant);
    }
}

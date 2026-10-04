package com.giftastic.giftastic.modules.delivery.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VendorDeliveryPricingId implements Serializable {
    private UUID vendorId;
    private UUID zoneId;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VendorDeliveryPricingId that = (VendorDeliveryPricingId) o;
        return Objects.equals(vendorId, that.vendorId) && Objects.equals(zoneId, that.zoneId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(vendorId, zoneId);
    }
}

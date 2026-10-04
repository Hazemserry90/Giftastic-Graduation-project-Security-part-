package com.giftastic.giftastic.modules.delivery.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "vendor_delivery_pricing")
@IdClass(VendorDeliveryPricingId.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VendorDeliveryPricing {
    
    @Id
    @NonNull
    private UUID vendorId;
    
    @Id
    @NonNull
    private UUID zoneId;
    
    @Column(nullable = false, precision = 19, scale = 2)
    @NonNull
    private BigDecimal deliveryCost;
    
    @Column(nullable = false)
    @NonNull
    private LocalDateTime updatedAt;
    
    private VendorDeliveryPricing(UUID vendorId, UUID zoneId, BigDecimal deliveryCost) {
        this.vendorId = vendorId;
        this.zoneId = zoneId;
        this.deliveryCost = deliveryCost;
        this.updatedAt = LocalDateTime.now();
    }
    
    public static VendorDeliveryPricing create(UUID vendorId, UUID zoneId, BigDecimal deliveryCost) {
        validateDeliveryCost(deliveryCost);
        return new VendorDeliveryPricing(vendorId, zoneId, deliveryCost);
    }
    
    public void updateCost(BigDecimal newCost) {
        validateDeliveryCost(newCost);
        this.deliveryCost = newCost;
        this.updatedAt = LocalDateTime.now();
    }
    
    private static void validateDeliveryCost(BigDecimal cost) {
        if (cost == null || cost.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Delivery cost must be >= 0");
        }
    }
}

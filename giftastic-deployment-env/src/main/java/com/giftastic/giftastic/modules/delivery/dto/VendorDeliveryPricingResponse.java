package com.giftastic.giftastic.modules.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.delivery.domain.VendorDeliveryPricing;

public record VendorDeliveryPricingResponse(
    UUID vendorId,
    UUID zoneId,
    String zoneName,
    BigDecimal deliveryCost,
    LocalDateTime updatedAt
) {
    public static VendorDeliveryPricingResponse from(VendorDeliveryPricing pricing, String zoneName) {
        return new VendorDeliveryPricingResponse(
            pricing.getVendorId(),
            pricing.getZoneId(),
            zoneName,
            pricing.getDeliveryCost(),
            pricing.getUpdatedAt()
        );
    }
}

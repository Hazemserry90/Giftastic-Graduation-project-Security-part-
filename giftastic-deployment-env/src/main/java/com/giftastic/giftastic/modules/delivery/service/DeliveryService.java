package com.giftastic.giftastic.modules.delivery.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.giftastic.giftastic.modules.delivery.domain.DeliveryZone;
import com.giftastic.giftastic.modules.delivery.domain.VendorDeliveryPricing;

public interface DeliveryService {
    
    List<DeliveryZone> getAllActiveZones();
    
    DeliveryZone getZoneById(UUID zoneId);
    
    List<VendorDeliveryPricing> getVendorPricing(UUID vendorId);
    
    BigDecimal getDeliveryCost(UUID vendorId, UUID zoneId);
    
    void updateVendorPricing(UUID vendorId, Map<UUID, BigDecimal> zonePricing);
    
    boolean hasVendorSetPricing(UUID vendorId);
}

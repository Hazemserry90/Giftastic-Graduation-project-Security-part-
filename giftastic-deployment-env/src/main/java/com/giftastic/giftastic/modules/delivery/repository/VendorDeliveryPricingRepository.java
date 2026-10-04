package com.giftastic.giftastic.modules.delivery.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.delivery.domain.VendorDeliveryPricing;
import com.giftastic.giftastic.modules.delivery.domain.VendorDeliveryPricingId;

@Repository
public interface VendorDeliveryPricingRepository extends JpaRepository<VendorDeliveryPricing, VendorDeliveryPricingId> {
    List<VendorDeliveryPricing> findByVendorId(UUID vendorId);
    Optional<VendorDeliveryPricing> findByVendorIdAndZoneId(UUID vendorId, UUID zoneId);
}

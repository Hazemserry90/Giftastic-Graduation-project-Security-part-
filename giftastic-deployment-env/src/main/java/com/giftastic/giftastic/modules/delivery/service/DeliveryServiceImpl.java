package com.giftastic.giftastic.modules.delivery.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.delivery.domain.DeliveryZone;
import com.giftastic.giftastic.modules.delivery.domain.VendorDeliveryPricing;
import com.giftastic.giftastic.modules.delivery.repository.DeliveryZoneRepository;
import com.giftastic.giftastic.modules.delivery.repository.VendorDeliveryPricingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryServiceImpl implements DeliveryService {
    
    private final DeliveryZoneRepository zoneRepository;
    private final VendorDeliveryPricingRepository pricingRepository;
    
    @Override
    public List<DeliveryZone> getAllActiveZones() {
        return zoneRepository.findByIsActiveTrue();
    }
    
    @Override
    public DeliveryZone getZoneById(UUID zoneId) {
        return zoneRepository.findById(zoneId)
            .orElseThrow(() -> new ResourceNotFoundException("Delivery zone not found"));
    }
    
    @Override
    public List<VendorDeliveryPricing> getVendorPricing(UUID vendorId) {
        return pricingRepository.findByVendorId(vendorId);
    }
    
    @Override
    public BigDecimal getDeliveryCost(UUID vendorId, UUID zoneId) {
        log.info("DeliveryService: Looking up cost for vendorId={}, zoneId={}", vendorId, zoneId);
        var pricing = pricingRepository.findByVendorIdAndZoneId(vendorId, zoneId);
        if (pricing.isPresent()) {
            BigDecimal cost = pricing.get().getDeliveryCost();
            log.info("DeliveryService: Found pricing entry with cost={}", cost);
            return cost;
        } else {
            log.warn("DeliveryService: No pricing found for vendorId={}, zoneId={}, returning ZERO", vendorId, zoneId);
            return BigDecimal.ZERO;
        }
    }
    
    @Override
    @Transactional
    public void updateVendorPricing(UUID vendorId, Map<UUID, BigDecimal> zonePricing) {
        for (Map.Entry<UUID, BigDecimal> entry : zonePricing.entrySet()) {
            UUID zoneId = entry.getKey();
            BigDecimal cost = entry.getValue();
            
            // Verify zone exists
            getZoneById(zoneId);
            
            pricingRepository.findByVendorIdAndZoneId(vendorId, zoneId)
                .ifPresentOrElse(
                    existing -> {
                        existing.updateCost(cost);
                        pricingRepository.save(existing);
                    },
                    () -> {
                        VendorDeliveryPricing newPricing = VendorDeliveryPricing.create(vendorId, zoneId, cost);
                        pricingRepository.save(newPricing);
                    }
                );
        }
        
        log.info("Updated delivery pricing for vendor: {}, zones: {}", vendorId, zonePricing.size());
    }
    
    @Override
    public boolean hasVendorSetPricing(UUID vendorId) {
        List<DeliveryZone> activeZones = getAllActiveZones();
        List<VendorDeliveryPricing> vendorPricing = getVendorPricing(vendorId);
        return vendorPricing.size() >= activeZones.size();
    }
}

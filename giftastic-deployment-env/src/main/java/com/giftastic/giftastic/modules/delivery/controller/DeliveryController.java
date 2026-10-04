package com.giftastic.giftastic.modules.delivery.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.delivery.dto.DeliveryZoneResponse;
import com.giftastic.giftastic.modules.delivery.dto.UpdateDeliveryPricingRequest;
import com.giftastic.giftastic.modules.delivery.dto.VendorDeliveryPricingResponse;
import com.giftastic.giftastic.modules.delivery.service.DeliveryService;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;
import com.giftastic.giftastic.modules.vendor.service.VendorActivityService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
@Slf4j
public class DeliveryController {
    
    private final DeliveryService deliveryService;
    private final VendorActivityService vendorActivityService;
    
    @GetMapping("/zones")
    public ResponseEntity<List<DeliveryZoneResponse>> getAllZones() {
        log.info("Fetching all delivery zones");
        
        try {
            var zones = deliveryService.getAllActiveZones();
            log.info("Found {} active delivery zones", zones.size());
            return ResponseEntity.ok(zones.stream().map(DeliveryZoneResponse::from).toList());
        } catch (Exception e) {
            log.error("Failed to fetch delivery zones: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/vendor/{vendorId}/pricing")
    public ResponseEntity<List<VendorDeliveryPricingResponse>> getVendorPricing(@PathVariable UUID vendorId) {
        log.info("Fetching delivery pricing for vendor: {}", vendorId);
        
        try {
            var pricing = deliveryService.getVendorPricing(vendorId);
            var zones = deliveryService.getAllActiveZones();
            
            log.info("Found {} pricing entries for vendor {}", pricing.size(), vendorId);
            
            // Log each pricing entry for debugging
            pricing.forEach(p -> {
                log.info("Pricing entry: vendorId={}, zoneId={}, cost={}", 
                    p.getVendorId(), p.getZoneId(), p.getDeliveryCost());
            });
            
            var response = pricing.stream().map(p -> {
                String zoneName = zones.stream()
                    .filter(z -> z.getId().equals(p.getZoneId()))
                    .findFirst()
                    .map(z -> z.getZoneName())
                    .orElse("Unknown");
                return VendorDeliveryPricingResponse.from(p, zoneName);
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch vendor pricing for {}: {}", vendorId, e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/cost")
    public ResponseEntity<BigDecimal> getDeliveryCost(
            @RequestParam UUID vendorId,
            @RequestParam UUID zoneId) {
        log.info("Getting delivery cost for vendor: {} and zone: {}", vendorId, zoneId);
        BigDecimal cost = deliveryService.getDeliveryCost(vendorId, zoneId);
        log.info("Delivery cost result: {}", cost);
        return ResponseEntity.ok(cost);
    }
    
    @PostMapping("/vendor/{vendorId}/pricing")
    @PreAuthorize("hasPermission(#vendorId, 'VENDOR_OWNER')")
    public ResponseEntity<Void> updateVendorPricing(
            @PathVariable UUID vendorId,
            @RequestBody UpdateDeliveryPricingRequest request) {
        deliveryService.updateVendorPricing(vendorId, request.zonePricing());
        
        vendorActivityService.logActivity(
            vendorId,
            VendorActivityType.DELIVERY_PRICING_UPDATED,
            "Delivery pricing updated for " + request.zonePricing().size() + " zones",
            null,
            null
        );
        
        return ResponseEntity.ok().build();
    }
}

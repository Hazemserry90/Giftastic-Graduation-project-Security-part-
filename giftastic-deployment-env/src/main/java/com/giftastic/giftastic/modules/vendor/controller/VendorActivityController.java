package com.giftastic.giftastic.modules.vendor.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;
import com.giftastic.giftastic.modules.vendor.dto.VendorActivityResponse;
import com.giftastic.giftastic.modules.vendor.service.VendorActivityService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/vendors/{vendorId}/activities")
@RequiredArgsConstructor
public class VendorActivityController {
    
    private final VendorActivityService activityService;
    
    @GetMapping
    @PreAuthorize("hasPermission(#vendorId, 'VENDOR_OWNER')")
    public ResponseEntity<Page<VendorActivityResponse>> getActivities(
            @PathVariable UUID vendorId,
            @RequestParam(required = false) VendorActivityType activityType,
            Pageable pageable) {
        
        Page<VendorActivityResponse> activities;
        if (activityType != null) {
            activities = activityService.getVendorActivitiesByType(vendorId, activityType, pageable)
                .map(VendorActivityResponse::from);
        } else {
            activities = activityService.getVendorActivities(vendorId, pageable)
                .map(VendorActivityResponse::from);
        }
        
        return ResponseEntity.ok(activities);
    }
}

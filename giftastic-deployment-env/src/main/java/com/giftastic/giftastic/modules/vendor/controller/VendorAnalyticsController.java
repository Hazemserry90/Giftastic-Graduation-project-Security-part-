package com.giftastic.giftastic.modules.vendor.controller;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.vendor.dto.VendorAnalyticsResponse;
import com.giftastic.giftastic.modules.vendor.service.VendorAnalyticsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/vendors/{supplierId}/analytics")
@RequiredArgsConstructor
@Slf4j
public class VendorAnalyticsController {

    private final VendorAnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasPermission(#supplierId, 'VENDOR_OWNER') or hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<VendorAnalyticsResponse> getAnalytics(
            @PathVariable UUID supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("Fetching analytics for vendor: {}", supplierId);
        
        VendorAnalyticsResponse analytics = startDate != null || endDate != null
            ? analyticsService.getAnalytics(supplierId, startDate, endDate)
            : analyticsService.getAnalytics(supplierId);
        
        return ResponseEntity.ok(analytics);
    }
}

package com.giftastic.giftastic.modules.commission.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.commission.service.CommissionPricingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/commission-pricing")
@RequiredArgsConstructor
public class CommissionPricingController {
    private final CommissionPricingService pricingService;

    @GetMapping("/current-rate")
    @PreAuthorize("hasPermission(#supplierId, 'VENDOR_OWNER') or hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<CurrentCommissionRateResponse> getCurrentRate(@RequestParam UUID supplierId) {
        return ResponseEntity.ok(new CurrentCommissionRateResponse(
                pricingService.getApplicableRate(supplierId, LocalDateTime.now())));
    }

    public record CurrentCommissionRateResponse(BigDecimal rate) {}
}

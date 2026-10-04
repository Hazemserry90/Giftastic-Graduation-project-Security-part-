package com.giftastic.giftastic.modules.commission.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.commission.dto.FinancialAnalyticsDTO;
import com.giftastic.giftastic.modules.commission.service.FinancialAnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class FinancialAnalyticsController {

    private final FinancialAnalyticsService analyticsService;

    @GetMapping("/financial")
    @PreAuthorize("hasPermission(null, 'VIEW_FINANCIAL_ANALYTICS')")
    public ResponseEntity<FinancialAnalyticsDTO> getFinancialAnalytics() {
        FinancialAnalyticsDTO analytics = analyticsService.getFinancialAnalytics();
        return ResponseEntity.ok(analytics);
    }
}

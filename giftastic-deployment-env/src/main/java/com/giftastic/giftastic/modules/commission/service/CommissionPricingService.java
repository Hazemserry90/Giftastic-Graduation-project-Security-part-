package com.giftastic.giftastic.modules.commission.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.common.pricing.CommissionPriceQuote;
import com.giftastic.giftastic.common.pricing.CommissionRates;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;
import com.giftastic.giftastic.modules.commission.repository.CommissionRuleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommissionPricingService {
    public static final BigDecimal DEFAULT_COMMISSION_RATE = new BigDecimal("0.10");

    private final CommissionRuleRepository ruleRepository;

    public BigDecimal getApplicableRate(UUID supplierId, LocalDateTime at) {
        return ruleRepository.findActiveSupplierRule(supplierId, at)
                .map(rule -> CommissionRates.requireFraction(rule.getRate()))
                .or(() -> ruleRepository.findActiveGlobalRule(at)
                        .map(rule -> CommissionRates.requireFraction(rule.getRate())))
                .orElse(DEFAULT_COMMISSION_RATE);
    }

    public CommissionPriceQuote quote(UUID supplierId, BigDecimal amount, VendorPricingMode mode, LocalDateTime at) {
        return CommissionPriceQuote.calculate(amount, getApplicableRate(supplierId, at), mode);
    }
}

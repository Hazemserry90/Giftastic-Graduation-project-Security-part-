package com.giftastic.giftastic.modules.commission.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.CommissionRule;
import com.giftastic.giftastic.modules.commission.domain.RuleType;

public record CommissionRuleDTO(
    UUID id,
    RuleType type,
    UUID supplierId,
    String supplierName,
    BigDecimal rate,
    LocalDateTime startDate,
    LocalDateTime endDate,
    boolean active,
    LocalDateTime createdAt,
    UUID createdBy
) {
    public static CommissionRuleDTO from(CommissionRule rule, String supplierName) {
        return new CommissionRuleDTO(
            rule.getId(),
            rule.getType(),
            rule.getSupplierId(),
            supplierName,
            rule.getRate(),
            rule.getStartDate(),
            rule.getEndDate(),
            rule.isActive(),
            rule.getCreatedAt(),
            rule.getCreatedBy()
        );
    }
}

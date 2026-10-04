package com.giftastic.giftastic.modules.commission.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.RuleType;

public record CreateRuleRequest(
    RuleType type,
    UUID supplierId,
    BigDecimal rate,
    LocalDateTime startDate,
    LocalDateTime endDate
) {}

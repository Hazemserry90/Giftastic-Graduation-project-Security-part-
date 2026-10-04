package com.giftastic.giftastic.modules.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SetDiscountRequest(
    BigDecimal discountPercentage,
    LocalDateTime startDate,
    LocalDateTime endDate
) {
    public SetDiscountRequest {
        if (discountPercentage != null && 
            (discountPercentage.compareTo(BigDecimal.ZERO) < 0 || 
             discountPercentage.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }
    }
}

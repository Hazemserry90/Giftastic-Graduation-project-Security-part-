package com.giftastic.giftastic.common.pricing;

import java.math.BigDecimal;

public final class CommissionRates {
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private CommissionRates() {}

    public static BigDecimal requireFraction(BigDecimal rate) {
        BigDecimal normalized = normalizeToFraction(rate);
        if (normalized == null) {
            throw new IllegalArgumentException("Commission rate is required");
        }
        return normalized;
    }

    public static BigDecimal normalizeToFraction(BigDecimal rate) {
        if (rate == null) return null;
        if (rate.compareTo(BigDecimal.ZERO) < 0) {
            throw invalidRate();
        }
        if (rate.compareTo(BigDecimal.ONE) <= 0) {
            return rate;
        }
        if (rate.compareTo(ONE_HUNDRED) <= 0) {
            return rate.divide(ONE_HUNDRED);
        }
        throw invalidRate();
    }

    public static String formatPercent(BigDecimal rate) {
        return requireFraction(rate).multiply(ONE_HUNDRED).stripTrailingZeros().toPlainString();
    }

    private static IllegalArgumentException invalidRate() {
        return new IllegalArgumentException("Commission rate must be between 0% and 100%");
    }
}

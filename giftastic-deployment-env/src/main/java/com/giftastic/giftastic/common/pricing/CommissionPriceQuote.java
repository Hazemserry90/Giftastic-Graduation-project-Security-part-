package com.giftastic.giftastic.common.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record CommissionPriceQuote(
        BigDecimal enteredAmount,
        BigDecimal customerPrice,
        BigDecimal commissionAmount,
        BigDecimal vendorPayout,
        BigDecimal commissionRate,
        VendorPricingMode pricingMode) {

    public static CommissionPriceQuote calculate(BigDecimal enteredAmount, BigDecimal rate, VendorPricingMode mode) {
        if (enteredAmount == null || enteredAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Entered amount must be positive");
        }
        BigDecimal commissionRate = CommissionRates.requireFraction(rate);
        VendorPricingMode effectiveMode = mode == null ? VendorPricingMode.CUSTOMER_PRICE : mode;
        BigDecimal customerPrice = enteredAmount.setScale(2, RoundingMode.HALF_UP);
        if (effectiveMode == VendorPricingMode.GUARANTEED_VENDOR_PAYOUT) {
            if (commissionRate.compareTo(BigDecimal.ONE) == 0) {
                throw new IllegalStateException("A vendor payout cannot be guaranteed with a 100% commission rate");
            }
            customerPrice = enteredAmount.divide(BigDecimal.ONE.subtract(commissionRate), 2, RoundingMode.HALF_UP);
            while (vendorPayout(customerPrice, commissionRate).compareTo(enteredAmount) < 0) {
                customerPrice = customerPrice.add(new BigDecimal("0.01"));
            }
        }
        BigDecimal commission = customerPrice.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        return new CommissionPriceQuote(enteredAmount.setScale(2, RoundingMode.HALF_UP), customerPrice,
                commission, customerPrice.subtract(commission), commissionRate, effectiveMode);
    }

    private static BigDecimal vendorPayout(BigDecimal customerPrice, BigDecimal rate) {
        return customerPrice.subtract(customerPrice.multiply(rate).setScale(2, RoundingMode.HALF_UP));
    }
}

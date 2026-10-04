package com.giftastic.giftastic.modules.commission.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinancialAnalyticsDTO(
    BigDecimal totalItemSubtotal,
    BigDecimal totalDeliveryCost,
    BigDecimal totalCustomerPayments,
    BigDecimal totalVendorEarnings,
    BigDecimal totalCommissionsOwed,
    BigDecimal totalCommissionsPaid,
    BigDecimal totalPlatformRevenue,
    BigDecimal codOrderValue,
    BigDecimal instapayOrderValue,
    BigDecimal pendingVendorPayments,
    BigDecimal submittedVendorPayments,
    BigDecimal completedVendorPayments,
    BigDecimal pendingVendorPayouts,
    BigDecimal submittedVendorPayouts,
    BigDecimal completedVendorPayouts,
    BigDecimal invalidOrFailedPayments,
    long codOrderCount,
    long instapayOrderCount,
    long invalidOrFailedOrderCount,
    List<VendorFinancialSummary> byVendor,
    List<MonthlyFinancialSummary> byMonth,
    List<InvalidVendorPortionSummary> invalidVendorPortions
) {
    public record VendorFinancialSummary(
        String supplierId,
        String storeName,
        BigDecimal totalEarnings,
        BigDecimal commissionsPaid,
        BigDecimal commissionsOwed,
        BigDecimal pendingPayouts,
        BigDecimal completedPayouts
    ) {}

    public record MonthlyFinancialSummary(
        String month,
        BigDecimal itemSubtotal,
        BigDecimal deliveryTotal,
        BigDecimal customerPayments,
        BigDecimal commissionsCollected,
        BigDecimal vendorPayoutsCompleted,
        BigDecimal codOrderValue,
        BigDecimal instapayOrderValue,
        BigDecimal invalidOrFailedPayments
    ) {}

    public record InvalidVendorPortionSummary(
        String supplierId,
        String storeName,
        long invalidatedPortions,
        BigDecimal invalidatedSubtotal,
        String latestReason,
        String latestDetails,
        java.time.LocalDateTime latestInvalidatedAt
    ) {}
}

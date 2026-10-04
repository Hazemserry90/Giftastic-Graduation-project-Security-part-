package com.giftastic.giftastic.modules.vendor.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import lombok.Builder;

@Builder
public record VendorAnalyticsResponse(
    UUID supplierId,
    String storeName,
    OverviewMetrics overview,
    List<ProductPerformance> topProducts,
    List<RevenueByPeriod> revenueHistory,
    List<OrderStatusBreakdown> orderBreakdown
) {
    @Builder
    public record OverviewMetrics(
        int totalProducts,
        int approvedProducts,
        int pendingProducts,
        int totalOrders,
        BigDecimal totalRevenue,
        BigDecimal averageOrderValue,
        int totalReviews,
        double averageRating
    ) {}
    
    @Builder
    public record ProductPerformance(
        UUID productId,
        String productName,
        int orderCount,
        int quantitySold,
        BigDecimal revenue,
        double averageRating,
        int reviewCount
    ) {}
    
    @Builder
    public record RevenueByPeriod(
        String period,
        BigDecimal revenue,
        int orderCount
    ) {}
    
    @Builder
    public record OrderStatusBreakdown(
        String status,
        int count,
        BigDecimal totalValue
    ) {}
}

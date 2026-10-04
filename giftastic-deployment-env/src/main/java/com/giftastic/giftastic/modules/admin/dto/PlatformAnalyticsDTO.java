package com.giftastic.giftastic.modules.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsDTO(
    List<TopProduct> topProducts,
    List<TopCustomer> topCustomers,
    List<TopVendor> topVendors
) {
    public record TopProduct(
        String productId,
        String productName,
        String vendorStoreName,
        Long totalSales,
        BigDecimal totalRevenue
    ) {}

    public record TopCustomer(
        String customerId,
        String customerName,
        String customerEmail,
        Long totalOrders,
        BigDecimal totalSpent
    ) {}

    public record TopVendor(
        String supplierId,
        String storeName,
        Long totalOrders,
        BigDecimal totalRevenue,
        BigDecimal averageOrderValue
    ) {}
}

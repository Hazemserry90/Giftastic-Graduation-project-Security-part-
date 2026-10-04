package com.giftastic.giftastic.modules.vendor.service;

import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.dto.VendorAnalyticsResponse;

public interface VendorAnalyticsService {
    
    /**
     * Get comprehensive analytics for a vendor.
     */
    VendorAnalyticsResponse getAnalytics(UUID supplierId);
    
    /**
     * Get analytics for a specific time period.
     */
    VendorAnalyticsResponse getAnalytics(UUID supplierId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}

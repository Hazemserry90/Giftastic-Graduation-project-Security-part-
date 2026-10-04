package com.giftastic.giftastic.modules.order.service;

import java.time.LocalDateTime;
import java.util.UUID;

public interface DeliveryNotificationService {
    void notifyDeliveryDelay(UUID orderId, String reason, LocalDateTime newEstimatedDate);
    void notifyEstimateUpdate(UUID orderId, LocalDateTime newEstimatedDate);
    void updateDeliveryEstimate(UUID orderId, LocalDateTime estimatedDate, String notes);
}

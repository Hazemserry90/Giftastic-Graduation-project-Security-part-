package com.giftastic.giftastic.modules.order.dto;

import java.time.LocalDateTime;

public record UpdateDeliveryEstimateRequest(
    LocalDateTime estimatedDeliveryDate,
    String notes
) {}

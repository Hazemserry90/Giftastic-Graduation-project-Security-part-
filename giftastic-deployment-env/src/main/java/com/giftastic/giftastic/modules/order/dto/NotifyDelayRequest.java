package com.giftastic.giftastic.modules.order.dto;

import java.time.LocalDateTime;

public record NotifyDelayRequest(
    String reason,
    LocalDateTime newEstimatedDate
) {}

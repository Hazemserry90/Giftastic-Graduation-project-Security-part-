package com.giftastic.giftastic.modules.commission.dto;

import com.giftastic.giftastic.modules.order.domain.OrderStatus;

public record UpdateOrderStatusRequest(
    OrderStatus status
) {}

package com.giftastic.giftastic.modules.order.dto;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.order.domain.GuestInfo;
import com.giftastic.giftastic.modules.order.domain.OrderItem;

public record GuestCheckoutRequest(
    GuestInfo guestInfo,
    List<OrderItem> items,
    String paymentMethod,
    String instapayPhoneNumber,
    String instapayRefundPhoneNumber,
    String instapayRefundName,
    UUID deliveryZoneId
) {}

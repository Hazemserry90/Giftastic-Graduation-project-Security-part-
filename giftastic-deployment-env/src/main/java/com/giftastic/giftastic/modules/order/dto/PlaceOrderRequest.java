package com.giftastic.giftastic.modules.order.dto;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.order.domain.OrderItem;

import lombok.Data;

@Data
public class PlaceOrderRequest {
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private List<OrderItem> items;
    private String shippingAddress;
    private String paymentMethod;
    private String instapayPhoneNumber;
    private String instapayRefundPhoneNumber;
    private String instapayRefundName;
    private UUID deliveryZoneId;
}

package com.giftastic.giftastic.modules.order.dto;

import java.util.UUID;

public record ChangePaymentMethodRequest(
        UUID customerId,
        String paymentMethod,
        String instapayPhoneNumber,
        String instapayRefundPhoneNumber,
        String instapayRefundName
) {}

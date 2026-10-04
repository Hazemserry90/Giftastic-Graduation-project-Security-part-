package com.giftastic.giftastic.modules.order.dto;

import java.util.List;

public record GuestInstapayTransactionIdsRequest(
    String email,
    String phone,
    List<String> transactionIds
) {}

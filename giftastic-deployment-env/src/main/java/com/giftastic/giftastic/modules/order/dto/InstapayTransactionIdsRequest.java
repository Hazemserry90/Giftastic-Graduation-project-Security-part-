package com.giftastic.giftastic.modules.order.dto;

import java.util.List;
import java.util.UUID;

public record InstapayTransactionIdsRequest(UUID customerId, List<String> transactionIds) {}

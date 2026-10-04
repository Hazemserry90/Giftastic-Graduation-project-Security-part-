package com.giftastic.giftastic.modules.delivery.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record UpdateDeliveryPricingRequest(
    Map<UUID, BigDecimal> zonePricing
) {}

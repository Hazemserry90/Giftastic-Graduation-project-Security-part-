package com.giftastic.giftastic.common.dto;

import java.util.Set;
import java.util.UUID;

/**
 * Security DTO for order authorization checks.
 * Contains the supplier IDs of all products in the order.
 */
public record OrderSecurityDTO(
    UUID orderId,
    UUID customerId,
    Set<UUID> supplierIds
) {
}

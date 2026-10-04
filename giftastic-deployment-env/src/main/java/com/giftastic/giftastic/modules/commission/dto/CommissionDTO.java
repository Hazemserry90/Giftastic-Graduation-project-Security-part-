package com.giftastic.giftastic.modules.commission.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionStatus;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.order.domain.Order;

public record CommissionDTO(
    UUID id,
    UUID orderId,
    UUID supplierId,
    String supplierName,
    BigDecimal orderSubtotal,
    BigDecimal commissionRate,
    BigDecimal commissionAmount,
    BigDecimal payableAmount,
    CommissionDirection direction,
    CommissionStatus status,
    LocalDateTime dueDate,
    LocalDateTime paidAt,
    LocalDateTime createdAt,
    LocalDateTime orderPlacedAt,
    LocalDateTime completedAt,
    boolean isOverdue
) {
    public static CommissionDTO from(Commission commission, String supplierName) {
        return from(commission, supplierName, null);
    }

    public static CommissionDTO from(Commission commission, String supplierName, Order order) {
        return new CommissionDTO(
            commission.getId(),
            commission.getOrderId(),
            commission.getSupplierId(),
            supplierName,
            commission.getOrderSubtotal(),
            commission.getCommissionRate(),
            commission.getCommissionAmount(),
            commission.getPayableAmount(),
            commission.effectiveDirection(),
            commission.getStatus(),
            commission.getDueDate(),
            commission.getPaidAt(),
            commission.getCreatedAt(),
            order != null ? order.getPlacedAt() : null,
            order != null ? order.getVendorCompletedAt().get(commission.getSupplierId()) : null,
            commission.isOverdue()
        );
    }
}

package com.giftastic.giftastic.modules.commission.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.AssistanceStatus;
import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceRequest;

public record OrderAssistanceRequestDTO(
    UUID id,
    UUID orderId,
    UUID supplierId,
    String supplierName,
    String message,
    AssistanceStatus status,
    LocalDateTime requestedAt,
    LocalDateTime resolvedAt,
    UUID resolvedBy,
    String resolution,
    List<OrderAssistanceMessageDTO> messages
) {
    public static OrderAssistanceRequestDTO from(OrderAssistanceRequest request, String supplierName, List<OrderAssistanceMessageDTO> messages) {
        return new OrderAssistanceRequestDTO(
            request.getId(),
            request.getOrderId(),
            request.getSupplierId(),
            supplierName,
            request.getMessage(),
            request.getStatus(),
            request.getRequestedAt(),
            request.getResolvedAt(),
            request.getResolvedBy(),
            request.getResolution(),
            messages
        );
    }
}

package com.giftastic.giftastic.modules.commission.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.AssistanceSenderRole;
import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceMessage;

public record OrderAssistanceMessageDTO(
    UUID id,
    UUID requestId,
    UUID senderId,
    AssistanceSenderRole senderRole,
    String message,
    LocalDateTime createdAt
) {
    public static OrderAssistanceMessageDTO from(OrderAssistanceMessage message) {
        return new OrderAssistanceMessageDTO(
            message.getId(),
            message.getRequestId(),
            message.getSenderId(),
            message.getSenderRole(),
            message.getMessage(),
            message.getCreatedAt()
        );
    }
}

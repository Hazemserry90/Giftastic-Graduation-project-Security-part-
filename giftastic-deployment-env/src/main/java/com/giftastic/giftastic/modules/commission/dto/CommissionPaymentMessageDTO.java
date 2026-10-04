package com.giftastic.giftastic.modules.commission.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.CommissionPaymentMessage;
import com.giftastic.giftastic.modules.commission.domain.PaymentMessageSenderRole;

public record CommissionPaymentMessageDTO(
    UUID id,
    PaymentMessageSenderRole senderRole,
    String message,
    LocalDateTime sentAt
) {
    public static CommissionPaymentMessageDTO from(CommissionPaymentMessage message) {
        return new CommissionPaymentMessageDTO(
            message.getId(),
            message.getSenderRole(),
            message.getMessage(),
            message.getSentAt()
        );
    }
}

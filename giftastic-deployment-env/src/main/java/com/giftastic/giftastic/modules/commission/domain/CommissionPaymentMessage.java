package com.giftastic.giftastic.modules.commission.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommissionPaymentMessage {

    @Column(nullable = false, name = "message_id")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "sender_role")
    private PaymentMessageSenderRole senderRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, name = "sent_at")
    private LocalDateTime sentAt;

    private CommissionPaymentMessage(UUID id, PaymentMessageSenderRole senderRole, String message, LocalDateTime sentAt) {
        this.id = id;
        this.senderRole = senderRole;
        this.message = message;
        this.sentAt = sentAt;
    }

    public static CommissionPaymentMessage create(PaymentMessageSenderRole senderRole, String message) {
        if (senderRole == null) throw new IllegalArgumentException("Message sender is required");
        if (message == null || message.isBlank()) throw new IllegalArgumentException("Message cannot be empty");
        return new CommissionPaymentMessage(UUID.randomUUID(), senderRole, message.trim(), LocalDateTime.now());
    }
}

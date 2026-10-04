package com.giftastic.giftastic.modules.commission.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "order_assistance_messages", indexes = {
    @Index(name = "idx_assistance_message_request", columnList = "request_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderAssistanceMessage {

    @Id
    @NonNull
    private UUID id;

    @Column(nullable = false, name = "request_id")
    @NonNull
    private UUID requestId;

    @Column(nullable = false, name = "sender_id")
    @NonNull
    private UUID senderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "sender_role")
    @NonNull
    private AssistanceSenderRole senderRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    @NonNull
    private String message;

    @Column(nullable = false, name = "created_at")
    @NonNull
    private LocalDateTime createdAt;

    private OrderAssistanceMessage(UUID id, UUID requestId, UUID senderId, AssistanceSenderRole senderRole, String message) {
        this.id = id;
        this.requestId = requestId;
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.message = message;
        this.createdAt = LocalDateTime.now();
    }

    public static OrderAssistanceMessage create(UUID requestId, UUID senderId, AssistanceSenderRole senderRole, String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        return new OrderAssistanceMessage(UUID.randomUUID(), requestId, senderId, senderRole, message.trim());
    }
}

package com.giftastic.giftastic.modules.order.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InstapayPaymentMessage {
    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    private InstapayPaymentMessage(String senderRole, String message, LocalDateTime sentAt) {
        this.senderRole = senderRole;
        this.message = message;
        this.sentAt = sentAt;
    }

    public static InstapayPaymentMessage customer(String message, LocalDateTime sentAt) {
        return new InstapayPaymentMessage("CUSTOMER", message, sentAt);
    }

    public static InstapayPaymentMessage platform(String message, LocalDateTime sentAt) {
        return new InstapayPaymentMessage("PLATFORM", message, sentAt);
    }
}

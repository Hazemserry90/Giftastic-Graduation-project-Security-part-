package com.giftastic.giftastic.modules.commission.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "commission_payment_requests", indexes = {
    @Index(name = "idx_payment_request_commission", columnList = "commission_id"),
    @Index(name = "idx_payment_request_supplier", columnList = "supplier_id"),
    @Index(name = "idx_payment_request_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommissionPaymentRequest {

    @Id
    @NonNull
    private UUID id;

    @Column(nullable = false, name = "commission_id")
    @NonNull
    private UUID commissionId;

    @Column(nullable = false, name = "supplier_id")
    @NonNull
    private UUID supplierId;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "proof_image_url")
    private String proofImageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "commission_payment_request_messages", joinColumns = @JoinColumn(name = "payment_request_id"))
    private List<CommissionPaymentMessage> messages = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private PaymentRequestStatus status;

    @Column(nullable = false, name = "submitted_at")
    @NonNull
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(columnDefinition = "TEXT", name = "rejection_reason")
    private String rejectionReason;

    private CommissionPaymentRequest(UUID id, UUID commissionId, UUID supplierId,
                                    String message, String proofImageUrl,
                                    PaymentMessageSenderRole senderRole) {
        this.id = id;
        this.commissionId = commissionId;
        this.supplierId = supplierId;
        this.message = normalizeMessage(message);
        this.proofImageUrl = proofImageUrl;
        this.status = PaymentRequestStatus.PENDING;
        this.submittedAt = LocalDateTime.now();
        if (this.message != null) {
            this.messages.add(CommissionPaymentMessage.create(senderRole, this.message));
        }
    }

    public static CommissionPaymentRequest create(UUID commissionId, UUID supplierId, 
                                                 String message, String proofImageUrl) {
        return create(commissionId, supplierId, message, proofImageUrl, PaymentMessageSenderRole.VENDOR);
    }

    public static CommissionPaymentRequest create(UUID commissionId, UUID supplierId,
                                                 String message, String proofImageUrl,
                                                 PaymentMessageSenderRole senderRole) {
        return new CommissionPaymentRequest(UUID.randomUUID(), commissionId, supplierId,
                                          message, proofImageUrl, senderRole);
    }

    public void addMessage(PaymentMessageSenderRole senderRole, String message) {
        this.messages.add(CommissionPaymentMessage.create(senderRole, message));
    }

    public void approve(UUID reviewerId) {
        if (this.status != PaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be approved");
        }
        this.status = PaymentRequestStatus.APPROVED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
    }

    public void reject(UUID reviewerId, String reason) {
        if (this.status != PaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be rejected");
        }
        this.status = PaymentRequestStatus.REJECTED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
        this.rejectionReason = normalizeMessage(reason);
    }

    private static String normalizeMessage(String message) {
        return message == null || message.isBlank() ? null : message.trim();
    }
}

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
@Table(name = "order_assistance_requests", indexes = {
    @Index(name = "idx_assistance_order", columnList = "order_id"),
    @Index(name = "idx_assistance_supplier", columnList = "supplier_id"),
    @Index(name = "idx_assistance_status", columnList = "status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderAssistanceRequest {

    @Id
    @NonNull
    private UUID id;

    @Column(nullable = false, name = "order_id")
    @NonNull
    private UUID orderId;

    @Column(nullable = false, name = "supplier_id")
    @NonNull
    private UUID supplierId;

    @Column(nullable = false, columnDefinition = "TEXT")
    @NonNull
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private AssistanceStatus status;

    @Column(nullable = false, name = "requested_at")
    @NonNull
    private LocalDateTime requestedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    private OrderAssistanceRequest(UUID id, UUID orderId, UUID supplierId, String message) {
        this.id = id;
        this.orderId = orderId;
        this.supplierId = supplierId;
        this.message = message;
        this.status = AssistanceStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public static OrderAssistanceRequest create(UUID orderId, UUID supplierId, String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        return new OrderAssistanceRequest(UUID.randomUUID(), orderId, supplierId, message);
    }

    public void markInProgress() {
        if (this.status != AssistanceStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be marked in progress");
        }
        this.status = AssistanceStatus.IN_PROGRESS;
    }

    public void resolve(UUID adminId, String resolution) {
        if (this.status == AssistanceStatus.RESOLVED || this.status == AssistanceStatus.CLOSED) {
            throw new IllegalStateException("Request already resolved or closed");
        }
        this.status = AssistanceStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = adminId;
        this.resolution = resolution;
    }

    public void reopen() {
        if (this.status != AssistanceStatus.RESOLVED) {
            throw new IllegalStateException("Only resolved requests can be reopened");
        }
        this.status = AssistanceStatus.IN_PROGRESS;
    }

    public void close() {
        if (this.status != AssistanceStatus.RESOLVED) {
            throw new IllegalStateException("Only resolved requests can be closed");
        }
        this.status = AssistanceStatus.CLOSED;
    }
}

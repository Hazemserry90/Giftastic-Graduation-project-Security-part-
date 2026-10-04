package com.giftastic.giftastic.modules.admin.domain;

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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "admin_requests",
    indexes = {
        @Index(name = "idx_admin_requests_user_id", columnList = "user_id"),
        @Index(name = "idx_admin_requests_status", columnList = "status"),
        @Index(name = "idx_admin_requests_can_reapply_at", columnList = "can_reapply_at")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class AdminRequest {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminRequestStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "review_notes", length = 2000)
    private String reviewNotes;

    @Column(name = "can_reapply_at")
    private LocalDateTime canReapplyAt;

    public static AdminRequest create(UUID userId, String message) {
        return new AdminRequest(
            UUID.randomUUID(),
            userId,
            message,
            AdminRequestStatus.PENDING,
            LocalDateTime.now(),
            null,
            null,
            null,
            null
        );
    }

    public void approve(UUID reviewerId) {
        this.status = AdminRequestStatus.APPROVED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
        this.canReapplyAt = null;
    }

    public void reject(UUID reviewerId, String notes) {
        this.status = AdminRequestStatus.REJECTED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
        this.reviewNotes = notes;
        this.canReapplyAt = LocalDateTime.now().plusMonths(3);
    }

    public void invalidate(UUID reviewerId, String notes) {
        this.status = AdminRequestStatus.INVALIDATED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
        this.reviewNotes = notes;
    }

    public void resetCooldown(UUID adminId) {
        this.canReapplyAt = null;
        this.reviewNotes = (this.reviewNotes != null ? this.reviewNotes + " | " : "") 
            + "Cooldown reset by admin " + adminId + " at " + LocalDateTime.now();
    }
}

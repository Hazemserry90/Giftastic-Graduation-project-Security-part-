package com.giftastic.giftastic.modules.report.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "reports")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {
    
    @Id
    @NonNull
    private UUID id;
    
    @Column(nullable = false)
    @NonNull
    private UUID reporterId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private ReportType reportType;
    
    @Column(nullable = false)
    @NonNull
    private UUID reportedEntityId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    @NonNull
    private String reason;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private ReportStatus status;
    
    @Column(nullable = false)
    @NonNull
    private LocalDateTime createdAt;
    
    private LocalDateTime reviewedAt;
    
    private UUID reviewedBy;
    
    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    @Enumerated(EnumType.STRING)
    private ReportOutcomeType outcomeType;

    private String outcomeAction;
    
    private Report(UUID id, UUID reporterId, ReportType reportType, UUID reportedEntityId, 
                   String reason, String description) {
        this.id = id;
        this.reporterId = reporterId;
        this.reportType = reportType;
        this.reportedEntityId = reportedEntityId;
        this.reason = reason;
        this.description = description;
        this.status = ReportStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }
    
    public static Report create(UUID reporterId, ReportType reportType, UUID reportedEntityId, 
                                String reason, String description) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Report reason cannot be blank");
        }
        return new Report(UUID.randomUUID(), reporterId, reportType, reportedEntityId, reason, description);
    }
    
    public void markUnderReview(UUID adminId) {
        ensureStatus(ReportStatus.PENDING);
        this.status = ReportStatus.UNDER_REVIEW;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
    }
    
    public void markActionTaken(UUID adminId, String notes, String action) {
        if (isClosed()) {
            throw new IllegalStateException("Cannot take action on a closed report");
        }
        this.status = ReportStatus.ACTION_TAKEN;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
        this.adminNotes = notes;
        this.outcomeType = ReportOutcomeType.ACTION_TAKEN;
        this.outcomeAction = normalizeOutcomeAction(action);
    }
    
    public void dismiss(UUID adminId, String notes) {
        if (isClosed()) {
            throw new IllegalStateException("Cannot resolve a closed report");
        }
        this.status = ReportStatus.RESOLVED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
        this.adminNotes = notes;
        this.outcomeType = ReportOutcomeType.RESOLVED;
        this.outcomeAction = null;
    }
    
    public void resolve(UUID adminId, String notes) {
        if (isClosed()) {
            throw new IllegalStateException("Cannot resolve a closed report");
        }
        this.status = ReportStatus.RESOLVED;
        this.reviewedBy = adminId;
        this.reviewedAt = LocalDateTime.now();
        this.adminNotes = notes;
        this.outcomeType = ReportOutcomeType.RESOLVED;
        this.outcomeAction = null;
    }

    private String normalizeOutcomeAction(String action) {
        String normalized = action == null || action.isBlank() ? "ACTION_TAKEN" : action.trim().toUpperCase();
        return switch (normalized) {
            case "BAN_USER", "DEACTIVATE_VENDOR", "ACTION_TAKEN" -> normalized;
            default -> "ACTION_TAKEN";
        };
    }

    private boolean isClosed() {
        return this.status == ReportStatus.ACTION_TAKEN
                || this.status == ReportStatus.DISMISSED
                || this.status == ReportStatus.RESOLVED;
    }
    
    private void ensureStatus(ReportStatus expected) {
        if (this.status != expected) {
            throw new IllegalStateException("Invalid status transition: current=" + status + ", expected=" + expected);
        }
    }
}

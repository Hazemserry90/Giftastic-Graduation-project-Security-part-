package com.giftastic.giftastic.modules.review.domain;

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
@Table(name = "vendor_feedback")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VendorFeedback {
    
    @Id
    @NonNull
    private UUID id;
    
    @Column(nullable = false)
    @NonNull
    private UUID userId;
    
    @Column(nullable = false)
    @NonNull
    private UUID vendorId;
    
    @Column(nullable = false)
    @NonNull
    private UUID orderId;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    @NonNull
    private String feedback;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private ReviewStatus status;
    
    @Column(nullable = false)
    @NonNull
    private LocalDateTime createdAt;
    
    private LocalDateTime reviewedAt;
    
    private UUID reviewedBy;
    
    @Column(columnDefinition = "TEXT")
    private String moderatorNotes;
    
    @Column(nullable = false)
    private double contentScore;
    
    private VendorFeedback(UUID id, UUID userId, UUID vendorId, UUID orderId, 
                           String feedback, ReviewStatus status, double contentScore) {
        this.id = id;
        this.userId = userId;
        this.vendorId = vendorId;
        this.orderId = orderId;
        this.feedback = feedback;
        this.status = status;
        this.contentScore = contentScore;
        this.createdAt = LocalDateTime.now();
    }
    
    public static VendorFeedback create(UUID userId, UUID vendorId, UUID orderId, 
                                        String feedback, double contentScore) {
        if (feedback == null || feedback.isBlank()) {
            throw new IllegalArgumentException("Feedback cannot be blank");
        }
        
        ReviewStatus status = contentScore < 0.7 ? ReviewStatus.PENDING_REVIEW : ReviewStatus.APPROVED;
        
        return new VendorFeedback(
            UUID.randomUUID(),
            userId,
            vendorId,
            orderId,
            feedback,
            status,
            contentScore
        );
    }
    
    public void approve(UUID moderatorId, String notes) {
        this.status = ReviewStatus.APPROVED;
        this.reviewedBy = moderatorId;
        this.reviewedAt = LocalDateTime.now();
        this.moderatorNotes = notes;
    }
    
    public void reject(UUID moderatorId, String notes) {
        this.status = ReviewStatus.REJECTED;
        this.reviewedBy = moderatorId;
        this.reviewedAt = LocalDateTime.now();
        this.moderatorNotes = notes;
    }
}

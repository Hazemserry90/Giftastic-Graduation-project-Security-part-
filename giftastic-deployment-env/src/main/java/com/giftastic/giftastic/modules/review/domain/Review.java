package com.giftastic.giftastic.modules.review.domain;

import java.math.BigDecimal;
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
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {
    
    @Id
    @NonNull
    private UUID id;
    
    @Column(nullable = false)
    @NonNull
    private UUID userId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private ReviewType reviewType;
    
    @Column(nullable = false)
    @NonNull
    private UUID entityId;
    
    @Column(nullable = false, precision = 2, scale = 1)
    @NonNull
    private BigDecimal rating;
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
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
    private boolean isAnonymous;
    
    @Column(nullable = false)
    private double contentScore;
    
    private UUID orderId;
    
    private Review(UUID id, UUID userId, ReviewType reviewType, UUID entityId, 
                   BigDecimal rating, String comment, ReviewStatus status, 
                   boolean isAnonymous, double contentScore, UUID orderId) {
        this.id = id;
        this.userId = userId;
        this.reviewType = reviewType;
        this.entityId = entityId;
        this.rating = rating;
        this.comment = comment;
        this.status = status;
        this.isAnonymous = isAnonymous;
        this.contentScore = contentScore;
        this.orderId = orderId;
        this.createdAt = LocalDateTime.now();
    }
    
    public static Review create(UUID userId, ReviewType reviewType, UUID entityId, 
                                BigDecimal rating, String comment, boolean isAnonymous, 
                                double contentScore, UUID orderId) {
        validateRating(rating);
        
        ReviewStatus status = contentScore < 0.7 ? ReviewStatus.PENDING_REVIEW : ReviewStatus.APPROVED;
        
        return new Review(
            UUID.randomUUID(), 
            userId, 
            reviewType, 
            entityId, 
            rating, 
            comment, 
            status,
            isAnonymous,
            contentScore,
            orderId
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
    
    private static void validateRating(BigDecimal rating) {
        if (rating == null || rating.compareTo(BigDecimal.ZERO) < 0 || rating.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new IllegalArgumentException("Rating must be between 0 and 5");
        }
    }
}

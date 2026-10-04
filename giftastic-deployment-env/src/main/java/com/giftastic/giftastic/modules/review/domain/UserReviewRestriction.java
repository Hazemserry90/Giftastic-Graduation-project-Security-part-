package com.giftastic.giftastic.modules.review.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "user_review_restrictions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserReviewRestriction {
    
    @Id
    @NonNull
    private UUID userId;
    
    @Column(nullable = false)
    private boolean canComment;
    
    @Column(nullable = false)
    private boolean canReview;
    
    @Column(nullable = false)
    @NonNull
    private LocalDateTime restrictedAt;
    
    @Column(nullable = false)
    @NonNull
    private UUID restrictedBy;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    private LocalDateTime expiresAt;
    
    private UserReviewRestriction(UUID userId, boolean canComment, boolean canReview, 
                                  UUID restrictedBy, String reason, LocalDateTime expiresAt) {
        this.userId = userId;
        this.canComment = canComment;
        this.canReview = canReview;
        this.restrictedBy = restrictedBy;
        this.reason = reason;
        this.restrictedAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
    }
    
    public static UserReviewRestriction create(UUID userId, boolean canComment, boolean canReview,
                                               UUID restrictedBy, String reason, LocalDateTime expiresAt) {
        return new UserReviewRestriction(userId, canComment, canReview, restrictedBy, reason, expiresAt);
    }
    
    public void updateRestrictions(boolean canComment, boolean canReview, LocalDateTime expiresAt) {
        this.canComment = canComment;
        this.canReview = canReview;
        this.expiresAt = expiresAt;
    }
    
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isActive() {
        return !isExpired();
    }
}

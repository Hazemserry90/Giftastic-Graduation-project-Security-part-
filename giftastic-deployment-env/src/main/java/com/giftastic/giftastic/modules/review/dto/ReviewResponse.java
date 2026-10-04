package com.giftastic.giftastic.modules.review.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;

public record ReviewResponse(
    UUID id,
    UUID userId,
    String authorName,
    ReviewType reviewType,
    UUID entityId,
    BigDecimal rating,
    String comment,
    ReviewStatus status,
    LocalDateTime createdAt,
    LocalDateTime reviewedAt,
    UUID reviewedBy,
    String moderatorNotes,
    boolean isAnonymous,
    double contentScore,
    UUID orderId
) {
    public static ReviewResponse from(Review review) {
        return from(review, null);
    }

    public static ReviewResponse from(Review review, String authorName) {
        return new ReviewResponse(
            review.getId(),
            review.getUserId(),
            authorName,
            review.getReviewType(),
            review.getEntityId(),
            review.getRating(),
            review.getComment(),
            review.getStatus(),
            review.getCreatedAt(),
            review.getReviewedAt(),
            review.getReviewedBy(),
            review.getModeratorNotes(),
            review.isAnonymous(),
            review.getContentScore(),
            review.getOrderId()
        );
    }
}

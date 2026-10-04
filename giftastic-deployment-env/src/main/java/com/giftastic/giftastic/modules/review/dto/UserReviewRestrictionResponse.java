package com.giftastic.giftastic.modules.review.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.UserReviewRestriction;

public record UserReviewRestrictionResponse(
    UUID userId,
    boolean canComment,
    boolean canReview,
    LocalDateTime restrictedAt,
    UUID restrictedBy,
    String reason,
    LocalDateTime expiresAt,
    boolean isActive
) {
    public static UserReviewRestrictionResponse from(UserReviewRestriction restriction) {
        return new UserReviewRestrictionResponse(
            restriction.getUserId(),
            restriction.isCanComment(),
            restriction.isCanReview(),
            restriction.getRestrictedAt(),
            restriction.getRestrictedBy(),
            restriction.getReason(),
            restriction.getExpiresAt(),
            restriction.isActive()
        );
    }
}

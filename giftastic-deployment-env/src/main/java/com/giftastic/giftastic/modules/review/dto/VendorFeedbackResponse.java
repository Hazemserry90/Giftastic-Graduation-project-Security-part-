package com.giftastic.giftastic.modules.review.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.VendorFeedback;

public record VendorFeedbackResponse(
    UUID id,
    UUID userId,
    UUID vendorId,
    UUID orderId,
    String feedback,
    ReviewStatus status,
    LocalDateTime createdAt,
    LocalDateTime reviewedAt,
    UUID reviewedBy,
    String moderatorNotes,
    double contentScore
) {
    public static VendorFeedbackResponse from(VendorFeedback feedback) {
        return new VendorFeedbackResponse(
            feedback.getId(),
            feedback.getUserId(),
            feedback.getVendorId(),
            feedback.getOrderId(),
            feedback.getFeedback(),
            feedback.getStatus(),
            feedback.getCreatedAt(),
            feedback.getReviewedAt(),
            feedback.getReviewedBy(),
            feedback.getModeratorNotes(),
            feedback.getContentScore()
        );
    }
}

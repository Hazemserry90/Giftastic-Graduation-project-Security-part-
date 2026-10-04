package com.giftastic.giftastic.modules.review.dto;

import java.time.LocalDateTime;

public record UpdateRestrictionRequest(
    boolean canComment,
    boolean canReview,
    String reason,
    LocalDateTime expiresAt
) {}

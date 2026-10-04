package com.giftastic.giftastic.modules.review.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.ReviewType;

public record CreateReviewRequest(
    ReviewType reviewType,
    UUID entityId,
    BigDecimal rating,
    String comment,
    boolean isAnonymous,
    UUID orderId
) {}

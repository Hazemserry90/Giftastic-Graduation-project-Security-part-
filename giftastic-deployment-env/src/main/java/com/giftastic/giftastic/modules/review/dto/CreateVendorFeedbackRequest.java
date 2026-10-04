package com.giftastic.giftastic.modules.review.dto;

import java.util.UUID;

public record CreateVendorFeedbackRequest(
    UUID vendorId,
    UUID orderId,
    String feedback
) {}

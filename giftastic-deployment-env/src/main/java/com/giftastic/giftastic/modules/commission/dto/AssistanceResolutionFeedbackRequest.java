package com.giftastic.giftastic.modules.commission.dto;

public record AssistanceResolutionFeedbackRequest(
    boolean resolved,
    String message
) {}

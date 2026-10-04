package com.giftastic.giftastic.modules.flow.dto;

public record GiftFlowLimitsResponse(
    int maxGiftFlowsPerVendor,
    int maxGiftFlowSteps
) {}

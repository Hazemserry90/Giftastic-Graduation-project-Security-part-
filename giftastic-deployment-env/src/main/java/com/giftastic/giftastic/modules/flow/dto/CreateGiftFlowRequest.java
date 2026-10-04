package com.giftastic.giftastic.modules.flow.dto;

public record CreateGiftFlowRequest(
        String name,
        String description,
        String imageUrl,
        String configuration
) {}
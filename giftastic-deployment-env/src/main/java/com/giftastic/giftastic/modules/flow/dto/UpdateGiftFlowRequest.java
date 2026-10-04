package com.giftastic.giftastic.modules.flow.dto;

public record UpdateGiftFlowRequest(
        String name,
        String description,
        String imageUrl,
        String configuration
) {}
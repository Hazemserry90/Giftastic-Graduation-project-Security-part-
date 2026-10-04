package com.giftastic.giftastic.modules.flow.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.flow.domain.GiftFlow;

public record GiftFlowResponse(
        UUID id,
        UUID supplierId,
        String name,
        String description,
        String imageUrl,
        String imageObjectKey,
        String imageFilename,
        String imageMimeType,
        Long imageSizeBytes,
        String configuration,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GiftFlowResponse from(GiftFlow flow) {
        return new GiftFlowResponse(
                flow.getId(),
                flow.getSupplierId(),
                flow.getName(),
                flow.getDescription(),
                flow.getImageUrl(),
                flow.getImageObjectKey(),
                flow.getImageFilename(),
                flow.getImageMimeType(),
                flow.getImageSizeBytes(),
                flow.getConfiguration(),
                flow.getCreatedAt(),
                flow.getUpdatedAt()
        );
    }
}

package com.giftastic.giftastic.modules.flow.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.flow.domain.GiftFlow;

public record GiftFlowImageResponse(
    UUID flowId,
    UUID vendorId,
    String objectKey,
    String url,
    String filename,
    String mimeType,
    Long sizeBytes,
    LocalDateTime updatedAt
) {
    public static GiftFlowImageResponse from(GiftFlow flow) {
        return new GiftFlowImageResponse(
                flow.getId(),
                flow.getSupplierId(),
                flow.getImageObjectKey(),
                flow.getImageUrl(),
                flow.getImageFilename(),
                flow.getImageMimeType(),
                flow.getImageSizeBytes(),
                flow.getImageUpdatedAt());
    }
}

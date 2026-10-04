package com.giftastic.giftastic.modules.product.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.product.domain.ProductImage;

public record ProductImageResponse(
    UUID id,
    UUID productId,
    UUID vendorId,
    String objectKey,
    String url,
    String filename,
    String mimeType,
    Long sizeBytes,
    boolean primary,
    int sortOrder,
    LocalDateTime createdAt
) {
    public static ProductImageResponse from(UUID productId, ProductImage image) {
        return new ProductImageResponse(
                image.getId(),
                productId,
                image.getVendorId(),
                image.getObjectKey(),
                image.getUrl(),
                image.getFilename(),
                image.getMimeType(),
                image.getSizeBytes(),
                image.isPrimary(),
                image.getDisplayOrder(),
                image.getCreatedAt());
    }
}

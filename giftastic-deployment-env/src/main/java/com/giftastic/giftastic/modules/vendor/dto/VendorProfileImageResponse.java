package com.giftastic.giftastic.modules.vendor.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImage;
import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImageType;

public record VendorProfileImageResponse(
    UUID id,
    UUID vendorId,
    VendorProfileImageType type,
    String objectKey,
    String url,
    String filename,
    String mimeType,
    long sizeBytes,
    int sortOrder,
    LocalDateTime createdAt
) {
    public static VendorProfileImageResponse from(VendorProfileImage image) {
        return new VendorProfileImageResponse(
                image.getId(),
                image.getVendorId(),
                image.getType(),
                image.getObjectKey(),
                image.getUrl(),
                image.getFilename(),
                image.getMimeType(),
                image.getSizeBytes(),
                image.getSortOrder(),
                image.getCreatedAt());
    }
}

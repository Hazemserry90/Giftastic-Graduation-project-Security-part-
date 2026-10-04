package com.giftastic.giftastic.modules.vendor.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.domain.VendorActivity;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;

public record VendorActivityResponse(
    UUID id,
    UUID vendorId,
    VendorActivityType activityType,
    String description,
    UUID relatedEntityId,
    String metadata,
    LocalDateTime occurredAt
) {
    public static VendorActivityResponse from(VendorActivity activity) {
        return new VendorActivityResponse(
            activity.getId(),
            activity.getVendorId(),
            activity.getActivityType(),
            activity.getDescription(),
            activity.getRelatedEntityId(),
            activity.getMetadata(),
            activity.getOccurredAt()
        );
    }
}

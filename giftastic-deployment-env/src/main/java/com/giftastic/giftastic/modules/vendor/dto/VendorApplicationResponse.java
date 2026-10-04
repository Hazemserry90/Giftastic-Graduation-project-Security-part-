package com.giftastic.giftastic.modules.vendor.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplicationStatus;

public record VendorApplicationResponse(
    UUID id,
    UUID userId,
    String storeName,
    String description,
    String logoUrl,
    String bannerUrl,
    String contactEmail,
    String contactPhone,
    String address,
    String websiteUrl,
    String instagramUrl,
    String facebookUrl,
    String workingHours,
    VendorApplicationStatus status,
    LocalDateTime submittedAt,
    LocalDateTime reviewedAt,
    UUID reviewedBy,
    String rejectionReason
) {
    public static VendorApplicationResponse from(VendorApplication application) {
        return new VendorApplicationResponse(
            application.getId(),
            application.getUserId(),
            application.getStoreName(),
            application.getDescription(),
            application.getLogoUrl(),
            application.getBannerUrl(),
            application.getContactEmail(),
            application.getContactPhone(),
            application.getAddress(),
            application.getWebsiteUrl(),
            application.getInstagramUrl(),
            application.getFacebookUrl(),
            application.getWorkingHours(),
            application.getStatus(),
            application.getSubmittedAt(),
            application.getReviewedAt(),
            application.getReviewedBy(),
            application.getRejectionReason()
        );
    }
}

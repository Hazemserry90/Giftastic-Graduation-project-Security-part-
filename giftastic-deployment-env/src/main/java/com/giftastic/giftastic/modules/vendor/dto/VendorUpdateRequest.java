package com.giftastic.giftastic.modules.vendor.dto;

import jakarta.validation.constraints.NotBlank;

public record VendorUpdateRequest(
    @NotBlank String storeName,
    String description,
    String logoUrl,
    String bannerUrl,
    String contactEmail,
    String contactPhone,
    String address,
    String websiteUrl,
    String instagramUrl,
    String facebookUrl,
    String workingHours
) {}

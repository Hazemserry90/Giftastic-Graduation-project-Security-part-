package com.giftastic.giftastic.modules.vendor.dto;

public record VendorApplicationRequest(
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
    String workingHours
) {}

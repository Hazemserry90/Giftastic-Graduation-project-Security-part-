package com.giftastic.giftastic.modules.user.dto;

import java.util.UUID;

public record PublicUserProfileResponse(
    UUID userId,
    String fullName,
    boolean isVendor,
    UUID vendorId,
    boolean isCommunityHelper,
    java.time.LocalDate memberSince
) {}

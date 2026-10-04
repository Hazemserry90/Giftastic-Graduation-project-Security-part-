package com.giftastic.giftastic.modules.admin.dto;

import java.util.UUID;

public record SendNotificationRequest(
    String target, // "ALL_USERS", "ALL_ADMINS", "SPECIFIC_USER", "SPECIFIC_ADMIN"
    UUID targetId, // Required if target is "SPECIFIC_USER" or "SPECIFIC_ADMIN"
    String title,
    String message
) {}

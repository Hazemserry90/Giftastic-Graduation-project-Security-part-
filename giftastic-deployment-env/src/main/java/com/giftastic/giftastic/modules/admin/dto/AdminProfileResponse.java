package com.giftastic.giftastic.modules.admin.dto;

import com.giftastic.giftastic.modules.admin.domain.AdminPermission;

import java.util.Set;
import java.util.UUID;

/**
 * Returned by GET /api/v1/admin/me – gives the frontend everything it needs to
 * render the permission dashboard for the currently authenticated admin.
 */
public record AdminProfileResponse(
        UUID userId,
        boolean isSuperAdmin,
        Set<AdminPermission> permissions,
        /** Every possible permission value so the UI can render "locked" tiles. */
        AdminPermission[] allPermissions
) {}

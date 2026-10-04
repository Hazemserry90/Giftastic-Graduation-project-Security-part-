package com.giftastic.giftastic.modules.admin.dto;

import java.util.Set;
import java.util.UUID;

import com.giftastic.giftastic.modules.admin.domain.Admin;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;

public record AdminPermissionSummaryResponse(
        UUID userId,
        Set<AdminPermission> permissions
) {
    public static AdminPermissionSummaryResponse from(Admin admin) {
        return new AdminPermissionSummaryResponse(admin.getUserId(), Set.copyOf(admin.getPermissions()));
    }
}

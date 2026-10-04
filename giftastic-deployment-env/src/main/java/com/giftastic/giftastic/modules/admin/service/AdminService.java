package com.giftastic.giftastic.modules.admin.service;

import com.giftastic.giftastic.modules.admin.domain.Admin;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.dto.AdminPermissionSummaryResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminService {
    void promoteToAdmin(UUID userId);
    void grantPermission(UUID userId, AdminPermission permission);
    void revokePermission(UUID userId, AdminPermission permission);
    Optional<Admin> getAdminDetails(UUID userId);
    List<AdminPermissionSummaryResponse> getAllAdminProfiles();
    boolean isAuthorized(UUID userId, AdminPermission requiredPermission);
    void demoteAdmin(UUID userId);
}

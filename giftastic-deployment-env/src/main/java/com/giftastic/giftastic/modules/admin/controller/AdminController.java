package com.giftastic.giftastic.modules.admin.controller;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.admin.domain.Admin;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.dto.AdminProfileResponse;
import com.giftastic.giftastic.modules.admin.service.AdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin-management")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Admin role and permission management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class AdminController {

    private final AdminService adminService;

    // ── Self ─────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Get current admin profile",
        description = "Returns the authenticated user's admin record including all granted permissions " +
                      "and the full list of possible permissions. Used by the permission dashboard."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Admin profile returned"),
        @ApiResponse(responseCode = "404", description = "Caller does not have an admin record")
    })
    public ResponseEntity<AdminProfileResponse> getMyAdminProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        Admin admin = adminService.getAdminDetails(userId)
                .orElseThrow(() -> new RuntimeException("No admin record for current user"));

        Set<AdminPermission> perms = admin.getPermissions();
        boolean isSuperAdmin = perms.contains(AdminPermission.SUPER_ADMIN);

        return ResponseEntity.ok(new AdminProfileResponse(
                userId,
                isSuperAdmin,
                perms,
                AdminPermission.values()
        ));
    }

    // ── Promote / Demote ─────────────────────────────────────────────────────

    @PostMapping("/promote/{userId}")
    @PreAuthorize("hasPermission(null, 'MAKE_ADMINS')")
    @Operation(
        summary = "Promote user to admin",
        description = "Creates an admin record for a regular user. Requires MAKE_ADMINS permission."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User promoted to admin successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "409", description = "User is already an admin")
    })
    public ResponseEntity<Void> initializeAdmin(
            @Parameter(description = "ID of the user to promote", required = true)
            @PathVariable UUID userId) {
        adminService.promoteToAdmin(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/demote/{userId}")
    @PreAuthorize("hasPermission(null, 'DEMOTE_ADMINS')")
    @Operation(
        summary = "Demote admin back to regular user",
        description = "Removes the admin record for a user. Requires DEMOTE_ADMINS permission."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Admin demoted successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Admin record not found")
    })
    public ResponseEntity<Void> demoteAdmin(
            @Parameter(description = "ID of the admin to demote", required = true)
            @PathVariable UUID userId) {
        adminService.demoteAdmin(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    @PatchMapping("/permissions/{userId}/grant")
    @PreAuthorize("hasPermission(null, 'MANAGE_ADMIN_PERMISSIONS')")
    @Operation(
        summary = "Grant permission to admin",
        description = "Grants a specific permission to an admin user. Requires MANAGE_ADMIN_PERMISSIONS."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Permission granted successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid permission"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "User not found or not an admin"),
        @ApiResponse(responseCode = "409", description = "User already has this permission")
    })
    public ResponseEntity<Void> grantPermission(
            @Parameter(description = "ID of the admin user", required = true)
            @PathVariable UUID userId,
            @Parameter(description = "Permission to grant", required = true)
            @RequestParam AdminPermission permission) {
        adminService.grantPermission(userId, permission);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/permissions/{userId}/revoke")
    @PreAuthorize("hasPermission(null, 'MANAGE_ADMIN_PERMISSIONS')")
    @Operation(
        summary = "Revoke permission from admin",
        description = "Revokes a specific permission from an admin user. Requires MANAGE_ADMIN_PERMISSIONS."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Permission revoked successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid permission"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "User not found or not an admin"),
        @ApiResponse(responseCode = "409", description = "User doesn't have this permission")
    })
    public ResponseEntity<Void> revokePermission(
            @Parameter(description = "ID of the admin user", required = true)
            @PathVariable UUID userId,
            @Parameter(description = "Permission to revoke", required = true)
            @RequestParam AdminPermission permission) {
        adminService.revokePermission(userId, permission);
        return ResponseEntity.noContent().build();
    }
}

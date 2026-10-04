package com.giftastic.giftastic.modules.admin.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.admin.dto.AdminRequestDTO;
import com.giftastic.giftastic.modules.admin.dto.SubmitAdminRequestRequest;
import com.giftastic.giftastic.modules.admin.service.AdminRequestService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin-requests")
@RequiredArgsConstructor
@Tag(name = "Admin Requests", description = "User requests to become admin")
@SecurityRequirement(name = "bearer-jwt")
public class AdminRequestController {

    private final AdminRequestService adminRequestService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Submit admin request", description = "User submits a request to become an admin")
    public ResponseEntity<AdminRequestDTO> submitRequest(@Valid @RequestBody SubmitAdminRequestRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        AdminRequestDTO dto = adminRequestService.submitRequest(userId, request.message());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get my admin requests", description = "Get all admin requests submitted by the current user")
    public ResponseEntity<List<AdminRequestDTO>> getMyRequests() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(adminRequestService.getUserRequests(userId));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasPermission(null, 'REVIEW_ADMIN_REQUESTS')")
    @Operation(summary = "Get user's admin requests", description = "Admin views all requests from a specific user")
    public ResponseEntity<List<AdminRequestDTO>> getUserRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminRequestService.getUserRequests(userId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasPermission(null, 'REVIEW_ADMIN_REQUESTS')")
    @Operation(summary = "Get pending requests", description = "Get all pending admin requests")
    public ResponseEntity<List<AdminRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(adminRequestService.getPendingRequests());
    }

    @PatchMapping("/{requestId}/approve")
    @PreAuthorize("hasPermission(null, 'MAKE_ADMINS')")
    @Operation(summary = "Approve admin request", description = "Approve a pending admin request and promote user")
    public ResponseEntity<Void> approveRequest(@PathVariable UUID requestId) {
        UUID reviewerId = SecurityUtils.getCurrentUserId();
        adminRequestService.approveRequest(requestId, reviewerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{requestId}/reject")
    @PreAuthorize("hasPermission(null, 'REVIEW_ADMIN_REQUESTS')")
    @Operation(summary = "Reject admin request", description = "Reject a pending admin request with 3-month cooldown")
    public ResponseEntity<Void> rejectRequest(
            @PathVariable UUID requestId,
            @RequestParam(required = false) String notes) {
        UUID reviewerId = SecurityUtils.getCurrentUserId();
        adminRequestService.rejectRequest(requestId, reviewerId, notes);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{requestId}/invalidate")
    @PreAuthorize("hasPermission(null, 'REVIEW_ADMIN_REQUESTS')")
    @Operation(summary = "Invalidate admin request", description = "Invalidate/delete a pending admin request")
    public ResponseEntity<Void> invalidateRequest(
            @PathVariable UUID requestId,
            @RequestParam(required = false) String notes) {
        UUID reviewerId = SecurityUtils.getCurrentUserId();
        adminRequestService.invalidateRequest(requestId, reviewerId, notes);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{requestId}/reset-cooldown")
    @PreAuthorize("hasPermission(null, 'MAKE_ADMINS')")
    @Operation(summary = "Reset cooldown", description = "Reset the 3-month cooldown for a rejected request")
    public ResponseEntity<Void> resetCooldown(@PathVariable UUID requestId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        adminRequestService.resetCooldown(requestId, adminId);
        return ResponseEntity.noContent().build();
    }
}

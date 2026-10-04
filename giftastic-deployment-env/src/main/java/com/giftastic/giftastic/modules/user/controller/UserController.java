package com.giftastic.giftastic.modules.user.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {

    private final UserService userService;

    // @GetMapping("/{userId}")
    // public ResponseEntity<UserResponse> getUserProfile(@PathVariable UUID userId)
    // {
    // return ResponseEntity.ok(userService.getUserById(userId));
    // }

    // @PatchMapping("/{userId}")
    // @PreAuthorize("hasPermission(#userId, 'USER_OWNER')")
    // public ResponseEntity<Void> updateProfile(
    // @PathVariable UUID userId,
    // @RequestBody UpdateProfileRequest request) {
    // userService.updateProfile(userId, request);
    // return ResponseEntity.noContent().build();
    // }

    @PostMapping("/{userId}/ban")
    @PreAuthorize("hasPermission(null, 'BAN_USERS')")
    @Operation(summary = "Ban user", description = "Bans a user account. Requires BAN_USERS permission (admin only).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User banned successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "409", description = "User already banned")
    })
    public ResponseEntity<Void> banUser(
            @Parameter(description = "ID of the user to ban", required = true) @PathVariable UUID userId) {
        userService.banUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/unban")
    @PreAuthorize("hasPermission(null, 'UNBAN_USERS')")
    @Operation(summary = "Unban user", description = "Unbans a user account. Requires UNBAN_USERS permission (admin only).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User unbanned successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "409", description = "User not banned")
    })
    public ResponseEntity<Void> unbanUser(
            @Parameter(description = "ID of the user to unban", required = true) @PathVariable UUID userId) {
        userService.unbanUser(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasPermission(null, 'DELETE_USERS')")
    @Operation(summary = "Delete user", description = "Deletes a user account. Requires DELETE_USERS permission (admin only).")
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "ID of the user to delete", required = true) @PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/request-admin")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Request admin role", description = "Submits a request for admin role elevation. Requires USER role.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Admin role request submitted successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
            @ApiResponse(responseCode = "409", description = "User already has admin role or pending request")
    })
    public ResponseEntity<Void> requestAdmin() {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        userService.requestAdminRole(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<com.giftastic.giftastic.modules.user.domain.User> getMyProfile() {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getById(userId));
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<com.giftastic.giftastic.modules.user.domain.User> updateMyProfile(
            @RequestBody com.giftastic.giftastic.modules.user.dto.UpdateProfileRequest request) {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity
                .ok(userService.updateProfile(userId, request.fullName(), request.phoneNumber(), request.birthday()));
    }

    @PatchMapping("/me/instapay-refund")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<com.giftastic.giftastic.modules.user.domain.User> updateMyInstapayRefundDetails(
            @RequestBody com.giftastic.giftastic.modules.user.dto.InstapayRefundDetailsRequest request) {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.updateInstapayRefundDetails(
                userId, request.instapayRefundPhoneNumber(), request.instapayRefundName()));
    }

    @GetMapping("/me/addresses")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<java.util.List<com.giftastic.giftastic.modules.user.domain.Address>> getMyAddresses() {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.getById(userId).getAddresses());
    }

    @PutMapping("/me/addresses")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<com.giftastic.giftastic.modules.user.domain.User> updateMyAddresses(
            @RequestBody com.giftastic.giftastic.modules.user.dto.AddressListRequest request) {
        UUID userId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(userService.updateAddresses(userId, request.addresses()));
    }

    @GetMapping("/profile/{userId}")
    @Operation(
        summary = "Get public user profile",
        description = "Returns public profile information for any user, including vendor and community helper status"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<com.giftastic.giftastic.modules.user.dto.PublicUserProfileResponse> getPublicProfile(
            @Parameter(description = "User ID") @PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }
}

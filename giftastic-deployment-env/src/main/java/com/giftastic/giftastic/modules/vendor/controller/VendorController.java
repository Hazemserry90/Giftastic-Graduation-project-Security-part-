package com.giftastic.giftastic.modules.vendor.controller;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImageType;
import com.giftastic.giftastic.modules.vendor.dto.ReorderVendorProfileImagesRequest;
import com.giftastic.giftastic.modules.vendor.service.VendorService;
import com.giftastic.giftastic.modules.vendor.service.VendorProfileImageService;
import com.giftastic.giftastic.modules.vendor.dto.VendorUpdateRequest;
import com.giftastic.giftastic.modules.vendor.dto.VendorProfileImageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendors", description = "Vendor/supplier management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class VendorController {

    private final VendorService vendorService;
    private final VendorProfileImageService vendorProfileImageService;

    @GetMapping
    @Operation(
        summary = "Get all verified vendors",
        description = "Retrieves all verified vendors/suppliers. Public endpoint - no authentication required."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vendors retrieved successfully")
    })
    public ResponseEntity<List<Vendor>> getVendors() {
        return ResponseEntity.ok(vendorService.getAllVerifiedVendors());
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'ACTIVATE_VENDORS') or hasPermission(null, 'DEACTIVATE_VENDORS') or hasPermission(null, 'MAKE_VENDORS')")
    public ResponseEntity<List<Vendor>> getAllVendorsForAdmin() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(
        summary = "Get my vendor profile",
        description = "Retrieves the authenticated vendor's profile details. Requires VENDOR role."
    )
    public ResponseEntity<Vendor> getMyVendorProfile() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return vendorService.getVendorByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/apply")
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Apply to become vendor",
        description = "Submits an application to become a vendor/supplier. Requires USER role."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vendor application submitted successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid store name"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "409", description = "User already has a vendor profile")
    })
    public ResponseEntity<Void> applyToBeVendor(
            @Parameter(description = "Name of the store/business", required = true)
            @RequestParam String storeName) {
        UUID userId = SecurityUtils.getCurrentUserId();
        vendorService.createVendorProfile(userId, storeName);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(
        summary = "Update my vendor profile",
        description = "Updates the authenticated vendor's store details. Requires VENDOR role."
    )
    public ResponseEntity<Vendor> updateMyProfile(@RequestBody VendorUpdateRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        
        // Fetch existing vendor to get the correct supplierId
        Vendor existing = vendorService.getVendorByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vendor profile not found"));
        
        // Use a temporary vendor object to hold update data
        Vendor updateData = new Vendor(
            userId, existing.getSupplierId(), request.storeName(), 
            request.description(), request.logoUrl(), 
            request.bannerUrl(), request.contactEmail(), 
            request.contactPhone(), request.address(),
            request.websiteUrl(), request.instagramUrl(),
            request.facebookUrl(), request.workingHours(),
            existing.isVerified()
        );
        
        return ResponseEntity.ok(vendorService.updateVendorProfile(userId, updateData));
    }

    @GetMapping("/me/images")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<VendorProfileImageResponse>> getMyProfileImages() {
        return ResponseEntity.ok(vendorProfileImageService.listProfileImages());
    }

    @PostMapping(value = "/me/images", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorProfileImageResponse> uploadMyProfileImage(
            @RequestParam("type") VendorProfileImageType type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(vendorProfileImageService.uploadProfileImage(type, file));
    }

    @PatchMapping("/me/images/reorder")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<VendorProfileImageResponse>> reorderMyProfileImages(
            @RequestBody @jakarta.validation.Valid ReorderVendorProfileImagesRequest request) {
        return ResponseEntity.ok(vendorProfileImageService.reorderProfileImages(request.imageIds()));
    }

    @DeleteMapping("/me/images/{imageId}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteMyProfileImage(@PathVariable UUID imageId) {
        vendorProfileImageService.deleteProfileImage(imageId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/activate")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_VENDORS')")
    @Operation(
        summary = "Activate vendor",
        description = "Activates/verifies a vendor application. Requires ACTIVATE_VENDORS permission (admin only)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Vendor activated successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Vendor application not found"),
        @ApiResponse(responseCode = "409", description = "Vendor already activated")
    })
    public ResponseEntity<Void> activateVendor(
            @Parameter(description = "ID of the user/vendor", required = true)
            @PathVariable UUID userId) {
        vendorService.toggleVerification(userId, true);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/deactivate")
    @PreAuthorize("hasPermission(null, 'DEACTIVATE_VENDORS')")
    @Operation(
        summary = "Deactivate vendor",
        description = "Deactivates a vendor application. Requires DEACTIVATE_VENDORS permission (admin only)."
    )
    public ResponseEntity<Void> deactivateVendor(
            @Parameter(description = "ID of the user/vendor", required = true)
            @PathVariable UUID userId) {
        vendorService.toggleVerification(userId, false);
        return ResponseEntity.noContent().build();
    }

}

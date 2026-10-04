package com.giftastic.giftastic.modules.vendor.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.dto.ReviewApplicationRequest;
import com.giftastic.giftastic.modules.vendor.dto.VendorApplicationRequest;
import com.giftastic.giftastic.modules.vendor.dto.VendorApplicationResponse;
import com.giftastic.giftastic.modules.vendor.service.VendorApplicationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/vendor-applications")
@RequiredArgsConstructor
@Slf4j
public class VendorApplicationController {

    private final VendorApplicationService applicationService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<VendorApplicationResponse> submitApplication(
            @RequestBody VendorApplicationRequest request) {
        
        UUID userId = SecurityUtils.getCurrentUserId();
        log.info("User {} submitting vendor application", userId);
        
        VendorApplication application = applicationService.submitApplication(userId, request);
        return ResponseEntity.status(201).body(VendorApplicationResponse.from(application));
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<VendorApplicationResponse>> getMyApplications() {
        UUID userId = SecurityUtils.getCurrentUserId();
        
        List<VendorApplicationResponse> applications = applicationService.getUserApplications(userId)
            .stream()
            .map(VendorApplicationResponse::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('MAKE_VENDORS') or hasAuthority('ACTIVATE_VENDORS')")
    public ResponseEntity<List<VendorApplicationResponse>> getPendingApplications() {
        log.info("Fetching pending vendor applications");
        
        List<VendorApplicationResponse> applications = applicationService.getPendingApplications()
            .stream()
            .map(VendorApplicationResponse::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{applicationId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('MAKE_VENDORS') or hasAuthority('ACTIVATE_VENDORS') or hasPermission(#applicationId, 'APPLICATION_OWNER')")
    public ResponseEntity<VendorApplicationResponse> getApplication(@PathVariable UUID applicationId) {
        VendorApplication application = applicationService.getApplicationById(applicationId);
        return ResponseEntity.ok(VendorApplicationResponse.from(application));
    }

    @PatchMapping("/{applicationId}/review")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('MAKE_VENDORS') or hasAuthority('ACTIVATE_VENDORS')")
    public ResponseEntity<Void> reviewApplication(
            @PathVariable UUID applicationId,
            @RequestBody ReviewApplicationRequest request) {
        
        UUID reviewerId = SecurityUtils.getCurrentUserId();
        log.info("Reviewer {} reviewing application {}", reviewerId, applicationId);
        
        if (request.approved()) {
            applicationService.approveApplication(applicationId, reviewerId);
        } else {
            applicationService.rejectApplication(applicationId, reviewerId, request.rejectionReason());
        }
        
        return ResponseEntity.noContent().build();
    }
}

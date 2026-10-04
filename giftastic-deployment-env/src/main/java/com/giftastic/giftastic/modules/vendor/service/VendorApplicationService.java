package com.giftastic.giftastic.modules.vendor.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.dto.VendorApplicationRequest;

public interface VendorApplicationService {
    
    /**
     * Submit a new vendor application.
     */
    VendorApplication submitApplication(UUID userId, VendorApplicationRequest request);
    
    /**
     * Get application by ID.
     */
    VendorApplication getApplicationById(UUID applicationId);
    
    /**
     * Get all applications for a user.
     */
    List<VendorApplication> getUserApplications(UUID userId);
    
    /**
     * Get all pending applications (admin only).
     */
    List<VendorApplication> getPendingApplications();
    
    /**
     * Approve an application and create vendor account.
     */
    void approveApplication(UUID applicationId, UUID reviewerId);
    
    /**
     * Reject an application.
     */
    void rejectApplication(UUID applicationId, UUID reviewerId, String reason);
    
    /**
     * Check if user has a pending application.
     */
    boolean hasPendingApplication(UUID userId);
}

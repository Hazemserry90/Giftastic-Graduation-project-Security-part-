package com.giftastic.giftastic.modules.vendor.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplicationStatus;
import com.giftastic.giftastic.modules.vendor.dto.VendorApplicationRequest;
import com.giftastic.giftastic.modules.vendor.repository.VendorApplicationRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorApplicationServiceImpl implements VendorApplicationService {

    private final VendorApplicationRepository applicationRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public VendorApplication submitApplication(UUID userId, VendorApplicationRequest request) {
        log.info("User {} submitting vendor application", userId);
        
        // Check if user already has a vendor account
        if (vendorRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("User already has a vendor account");
        }
        
        // Check if user has a pending application
        if (hasPendingApplication(userId)) {
            throw new IllegalStateException("User already has a pending application");
        }
        
        VendorApplication application = VendorApplication.submit(
            userId,
            request.storeName(),
            request.description(),
            request.logoUrl(),
            request.bannerUrl(),
            request.contactEmail(),
            request.contactPhone(),
            request.address(),
            request.websiteUrl(),
            request.instagramUrl(),
            request.facebookUrl(),
            request.workingHours()
        );
        
        return applicationRepository.save(application);
    }

    @Override
    public VendorApplication getApplicationById(UUID applicationId) {
        return applicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("Application not found"));
    }

    @Override
    public List<VendorApplication> getUserApplications(UUID userId) {
        return applicationRepository.findByUserIdOrderBySubmittedAtDesc(userId);
    }

    @Override
    public List<VendorApplication> getPendingApplications() {
        return applicationRepository.findByStatus(VendorApplicationStatus.PENDING);
    }

    @Override
    @Transactional
    public void approveApplication(UUID applicationId, UUID reviewerId) {
        log.info("Approving vendor application {} by reviewer {}", applicationId, reviewerId);
        
        VendorApplication application = getApplicationById(applicationId);
        application.approve(reviewerId);
        applicationRepository.save(application);
        
        // Create vendor account
        UUID supplierId = UUID.randomUUID();
        Vendor vendor = new Vendor(
            application.getUserId(),
            supplierId,
            application.getStoreName(),
            true // verified
        );
        
        // Update vendor profile with application details
        vendor.update(
            application.getStoreName(),
            application.getDescription(),
            application.getLogoUrl(),
            application.getBannerUrl(),
            application.getContactEmail(),
            application.getContactPhone(),
            application.getAddress(),
            application.getWebsiteUrl(),
            application.getInstagramUrl(),
            application.getFacebookUrl(),
            application.getWorkingHours()
        );
        
        vendorRepository.save(vendor);
        
        log.info("Vendor account created for user {} with supplierId {}", application.getUserId(), supplierId);
    }

    @Override
    @Transactional
    public void rejectApplication(UUID applicationId, UUID reviewerId, String reason) {
        log.info("Rejecting vendor application {} by reviewer {}", applicationId, reviewerId);
        
        VendorApplication application = getApplicationById(applicationId);
        application.reject(reviewerId, reason);
        applicationRepository.save(application);
    }

    @Override
    public boolean hasPendingApplication(UUID userId) {
        return applicationRepository.findByUserId(userId)
            .map(app -> app.getStatus() == VendorApplicationStatus.PENDING)
            .orElse(false);
    }
}

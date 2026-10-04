package com.giftastic.giftastic.modules.vendor.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.vendor.domain.VendorActivity;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;
import com.giftastic.giftastic.modules.vendor.repository.VendorActivityRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorActivityServiceImpl implements VendorActivityService {
    
    private final VendorActivityRepository activityRepository;
    
    @Override
    @Transactional
    public void logActivity(UUID vendorId, VendorActivityType activityType, String description, UUID relatedEntityId, String metadata) {
        VendorActivity activity = VendorActivity.log(vendorId, activityType, description, relatedEntityId, metadata);
        activityRepository.save(activity);
        log.debug("Logged activity for vendor {}: {}", vendorId, activityType);
    }
    
    @Override
    public Page<VendorActivity> getVendorActivities(UUID vendorId, Pageable pageable) {
        return activityRepository.findByVendorIdOrderByOccurredAtDesc(vendorId, pageable);
    }
    
    @Override
    public Page<VendorActivity> getVendorActivitiesByType(UUID vendorId, VendorActivityType activityType, Pageable pageable) {
        return activityRepository.findByVendorIdAndActivityTypeOrderByOccurredAtDesc(vendorId, activityType, pageable);
    }
}

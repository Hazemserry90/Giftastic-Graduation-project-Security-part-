package com.giftastic.giftastic.modules.vendor.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.giftastic.giftastic.modules.vendor.domain.VendorActivity;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;

public interface VendorActivityService {
    
    void logActivity(UUID vendorId, VendorActivityType activityType, String description, UUID relatedEntityId, String metadata);
    
    Page<VendorActivity> getVendorActivities(UUID vendorId, Pageable pageable);
    
    Page<VendorActivity> getVendorActivitiesByType(UUID vendorId, VendorActivityType activityType, Pageable pageable);
}

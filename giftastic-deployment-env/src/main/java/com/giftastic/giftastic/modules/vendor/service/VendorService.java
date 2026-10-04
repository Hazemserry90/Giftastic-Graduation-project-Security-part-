package com.giftastic.giftastic.modules.vendor.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.giftastic.giftastic.modules.vendor.domain.Vendor;

public interface VendorService {

    Vendor createVendorProfile(UUID userId, String storeName);

    boolean isUserVendorOf(UUID userId, UUID supplierId);

    Optional<Vendor> getVendorByUserId(UUID userId);

    List<Vendor> getAllVerifiedVendors();

    List<Vendor> getAllVendors();
    
    Vendor updateVendorProfile(UUID userId, Vendor updateData);

    void toggleVerification(UUID userId, boolean status);
}

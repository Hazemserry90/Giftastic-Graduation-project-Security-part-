package com.giftastic.giftastic.modules.vendor.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.vendor.domain.VendorActivity;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;

@Repository
public interface VendorActivityRepository extends JpaRepository<VendorActivity, UUID> {
    Page<VendorActivity> findByVendorIdOrderByOccurredAtDesc(UUID vendorId, Pageable pageable);
    Page<VendorActivity> findByVendorIdAndActivityTypeOrderByOccurredAtDesc(UUID vendorId, VendorActivityType activityType, Pageable pageable);
}

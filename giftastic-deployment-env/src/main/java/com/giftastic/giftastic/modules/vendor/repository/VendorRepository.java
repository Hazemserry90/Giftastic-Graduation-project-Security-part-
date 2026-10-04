package com.giftastic.giftastic.modules.vendor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.vendor.domain.Vendor;

public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    Optional<Vendor> findByUserId(UUID userId);
    Optional<Vendor> findBySupplierId(UUID supplierId);
    List<Vendor> findByIsVerifiedTrue();
    List<Vendor> findByIsVerifiedFalse();
    Page<Vendor> findByStoreNameContainingIgnoreCase(String storeName, Pageable pageable);
    Page<Vendor> findByIsVerifiedTrueAndStoreNameContainingIgnoreCase(String storeName, Pageable pageable);
}

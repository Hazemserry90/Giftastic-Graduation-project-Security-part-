package com.giftastic.giftastic.modules.vendor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplicationStatus;

public interface VendorApplicationRepository extends JpaRepository<VendorApplication, UUID> {
    Optional<VendorApplication> findByUserId(UUID userId);
    List<VendorApplication> findByStatus(VendorApplicationStatus status);
    List<VendorApplication> findByUserIdOrderBySubmittedAtDesc(UUID userId);
}

package com.giftastic.giftastic.modules.vendor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImage;
import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImageType;

public interface VendorProfileImageRepository extends JpaRepository<VendorProfileImage, UUID> {

    List<VendorProfileImage> findByVendorIdOrderBySortOrderAscCreatedAtAsc(UUID vendorId);

    List<VendorProfileImage> findByVendorIdAndTypeOrderBySortOrderAscCreatedAtAsc(UUID vendorId, VendorProfileImageType type);
}

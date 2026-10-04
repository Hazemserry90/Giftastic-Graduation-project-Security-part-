package com.giftastic.giftastic.modules.vendor.service;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.common.security.UserPrincipal;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorAccessService {

    private final VendorRepository vendorRepository;

    public Vendor requireCurrentActiveVendor() {
        UUID userId = SecurityUtils.getCurrentUserId();
        UUID supplierId = SecurityUtils.getCurrentSupplierId();
        return requireActiveVendor(userId, supplierId);
    }

    public UUID requireCurrentActiveSupplierId() {
        return requireCurrentActiveVendor().getSupplierId();
    }

    public UUID requireActiveSupplierId(UserPrincipal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Vendor profile is inactive.");
        }
        return requireActiveVendor(principal.getUserId(), principal.getSupplierId()).getSupplierId();
    }

    public Vendor requireActiveVendor(UUID userId, UUID supplierId) {
        if (userId == null || supplierId == null) {
            throw new AccessDeniedException("Vendor profile is inactive.");
        }
        return vendorRepository.findByUserId(userId)
                .filter(vendor -> supplierId.equals(vendor.getSupplierId()) && vendor.isVerified())
                .orElseThrow(() -> new AccessDeniedException("Vendor profile is inactive."));
    }
}

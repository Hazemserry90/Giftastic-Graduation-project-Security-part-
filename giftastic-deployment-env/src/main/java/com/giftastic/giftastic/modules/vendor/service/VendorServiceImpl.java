package com.giftastic.giftastic.modules.vendor.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public Vendor createVendorProfile(UUID userId, String storeName) {
        if (vendorRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("User is already a vendor");
        }
        
        Vendor vendor = new Vendor(userId, UUID.randomUUID(), storeName, false);
        return vendorRepository.save(vendor);
    }

    @Override
    public boolean isUserVendorOf(UUID userId, UUID supplierId) {
        return vendorRepository.findByUserId(userId)
                .map(v -> v.getSupplierId().equals(supplierId) && v.isVerified())
                .orElse(false);
    }

    @Override
    public Optional<Vendor> getVendorByUserId(UUID userId) {
        return vendorRepository.findByUserId(userId);
    }
    
    @Override
    public java.util.List<Vendor> getAllVerifiedVendors() {
        return vendorRepository.findByIsVerifiedTrue();
    }

    @Override
    public java.util.List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @Override
    @Transactional
    public Vendor updateVendorProfile(UUID userId, Vendor updateData) {
        Vendor existing = vendorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vendor profile not found"));
        
        existing.update(
            updateData.getStoreName(),
            updateData.getDescription(),
            updateData.getLogoUrl(),
            updateData.getBannerUrl(),
            updateData.getContactEmail(),
            updateData.getContactPhone(),
            updateData.getAddress(),
            updateData.getWebsiteUrl(),
            updateData.getInstagramUrl(),
            updateData.getFacebookUrl(),
            updateData.getWorkingHours()
        );
        
        return vendorRepository.save(existing);
    }

    @Override
    @Transactional
    public void toggleVerification(UUID userId, boolean status) {
        Vendor vendor = vendorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        if (status) vendor.verify(); else vendor.deactivate();
        vendorRepository.save(vendor);
    }
}

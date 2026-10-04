package com.giftastic.giftastic.modules.admin.service;

import com.giftastic.giftastic.modules.admin.domain.Admin;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.dto.AdminPermissionSummaryResponse;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;

    @Override
    @Transactional
    public void promoteToAdmin(UUID userId) {
        if (adminRepository.findByUserId(userId).isPresent()) {
            return; // Already an admin
        }
        Admin newAdmin = new Admin(userId, new HashSet<>());
        adminRepository.save(newAdmin);
    }

    @Override
    @Transactional
    public void grantPermission(UUID userId, AdminPermission permission) {
        Admin admin = adminRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Admin profile not found for user: " + userId));

        admin.grantPermission(permission);
        adminRepository.save(admin);
    }

    @Override
    @Transactional
    public void revokePermission(UUID userId, AdminPermission permission) {
        Admin admin = adminRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Admin profile not found"));

        admin.revokePermission(permission);
        adminRepository.save(admin);
    }

    @Override
    public Optional<Admin> getAdminDetails(UUID userId) {
        return adminRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public List<AdminPermissionSummaryResponse> getAllAdminProfiles() {
        return adminRepository.findAll().stream()
                .map(AdminPermissionSummaryResponse::from)
                .toList();
    }

    @Override
    public boolean isAuthorized(UUID userId, AdminPermission requiredPermission) {
        return adminRepository.findByUserId(userId)
                .map(admin -> admin.hasPermission(requiredPermission))
                .orElse(false);
    }

    @Override
    @Transactional
    public void demoteAdmin(UUID userId) {
        adminRepository.deleteByUserId(userId);
    }
}

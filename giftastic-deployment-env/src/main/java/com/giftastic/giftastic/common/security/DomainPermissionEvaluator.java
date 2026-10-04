package com.giftastic.giftastic.common.security;

import java.io.Serializable;
import java.util.UUID;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.giftastic.giftastic.common.dto.OrderSecurityDTO;
import com.giftastic.giftastic.common.dto.ProductSecurityDTO;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorApplicationRepository;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;

@Component
public class DomainPermissionEvaluator implements PermissionEvaluator {

    private final ProductRepository productRepository;
    private final VendorApplicationRepository vendorApplicationRepository;
    private final AdminRepository adminRepository;

    public DomainPermissionEvaluator(
            ProductRepository productRepository,
            VendorApplicationRepository vendorApplicationRepository,
            AdminRepository adminRepository) {
        this.productRepository = productRepository;
        this.vendorApplicationRepository = vendorApplicationRepository;
        this.adminRepository = adminRepository;
    }

    @Override
public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal) || permission == null) {
        return false;
    }

    String requiredPermission = permission.toString();

    var currentAdmin = adminRepository.findByUserId(principal.getUserId());
    if (currentAdmin.map(admin -> admin.hasPermission(AdminPermission.SUPER_ADMIN)).orElse(false)) {
        return true;
    }

    AdminPermission adminPermission = parseAdminPermission(requiredPermission);
    if (adminPermission != null) {
        return currentAdmin.map(admin -> admin.hasPermission(adminPermission))
                .orElse(false);
    }
    
    // Handle PRODUCT_OWNER permission - check if vendor owns the product
    if ("PRODUCT_OWNER".equals(requiredPermission) && targetDomainObject instanceof UUID productId) {
        return isProductOwner(principal, productId);
    }
    
    // Handle APPLICATION_OWNER permission - check if user owns the application
    if ("APPLICATION_OWNER".equals(requiredPermission) && targetDomainObject instanceof UUID applicationId) {
        return isApplicationOwner(principal, applicationId);
    }

    if (targetDomainObject instanceof UUID resourceOwnerId) {
        return isOwner(principal, resourceOwnerId);
    }

    if (targetDomainObject instanceof ProductSecurityDTO resource) {
        if (!resource.isPrivate()) {
            return true;
        }
        return isOwner(principal,resource.ownerId());
    }

    if (targetDomainObject instanceof OrderSecurityDTO orderSecurity) {
        return isOrderVendor(principal, orderSecurity);
    }

    return false;
}

    private AdminPermission parseAdminPermission(String permission) {
        try {
            return AdminPermission.valueOf(permission);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
        return false;
    }

    private boolean isOwner(UserPrincipal principal, UUID resourceOwnerId) {
        boolean isSupplierOwner = principal.getSupplierId() != null && principal.getSupplierId().equals(resourceOwnerId);
        boolean isUserOwner = principal.getUserId() != null && principal.getUserId().equals(resourceOwnerId);
        
        return isSupplierOwner || isUserOwner;
    }

    /**
     * Check if the vendor owns at least one product in the order.
     */
    private boolean isOrderVendor(UserPrincipal principal, OrderSecurityDTO orderSecurity) {
        UUID supplierId = principal.getSupplierId();
        if (supplierId == null) {
            return false;
        }
        return orderSecurity.supplierIds().contains(supplierId);
    }
    
    /**
     * Check if the vendor owns the product.
     */
    private boolean isProductOwner(UserPrincipal principal, UUID productId) {
        UUID supplierId = principal.getSupplierId();
        if (supplierId == null) {
            return false;
        }
        return productRepository.findById(productId)
                .map(product -> supplierId.equals(product.getSupplierId()))
                .orElse(false);
    }
    
    /**
     * Check if the user owns the application.
     */
    private boolean isApplicationOwner(UserPrincipal principal, UUID applicationId) {
        UUID userId = principal.getUserId();
        if (userId == null) {
            return false;
        }
        return vendorApplicationRepository.findById(applicationId)
                .map(application -> userId.equals(application.getUserId()))
                .orElse(false);
    }
}

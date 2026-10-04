package com.giftastic.giftastic.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.domain.VendorApplication;
import com.giftastic.giftastic.modules.vendor.repository.VendorApplicationRepository;
import com.giftastic.giftastic.modules.admin.domain.Admin;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;

class DomainPermissionEvaluatorTests {

    private ProductRepository productRepository;
    private VendorApplicationRepository applicationRepository;
    private AdminRepository adminRepository;
    private DomainPermissionEvaluator evaluator;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        applicationRepository = mock(VendorApplicationRepository.class);
        adminRepository = mock(AdminRepository.class);
        evaluator = new DomainPermissionEvaluator(productRepository, applicationRepository, adminRepository);
    }

    @Test
    void productOwnerRequiresExactSupplierMatch() {
        UUID productId = UUID.randomUUID();
        UUID ownerSupplierId = UUID.randomUUID();
        Product product = Product.create(ownerSupplierId, "Gift", BigDecimal.TEN, "Description");
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThat(evaluator.hasPermission(authentication(UUID.randomUUID(), ownerSupplierId), productId, "PRODUCT_OWNER"))
                .isTrue();
        assertThat(evaluator.hasPermission(authentication(UUID.randomUUID(), UUID.randomUUID()), productId, "PRODUCT_OWNER"))
                .isFalse();
    }

    @Test
    void applicationOwnerRequiresExactUserMatch() {
        UUID applicationId = UUID.randomUUID();
        UUID ownerUserId = UUID.randomUUID();
        VendorApplication application = mock(VendorApplication.class);
        when(application.getUserId()).thenReturn(ownerUserId);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));

        assertThat(evaluator.hasPermission(authentication(ownerUserId, null), applicationId, "APPLICATION_OWNER"))
                .isTrue();
        assertThat(evaluator.hasPermission(authentication(UUID.randomUUID(), null), applicationId, "APPLICATION_OWNER"))
                .isFalse();
    }

    @Test
    void missingResourcesAndMissingFacetsAreDenied() {
        UUID missingId = UUID.randomUUID();
        when(productRepository.findById(missingId)).thenReturn(Optional.empty());
        when(applicationRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThat(evaluator.hasPermission(authentication(UUID.randomUUID(), null), missingId, "PRODUCT_OWNER"))
                .isFalse();
        assertThat(evaluator.hasPermission(authentication(null, null), missingId, "APPLICATION_OWNER"))
                .isFalse();
    }

    @Test
    void adminPermissionsUseCurrentDatabaseStateInsteadOfStaleTokenClaims() {
        UUID userId = UUID.randomUUID();
        Admin admin = new Admin(userId, new java.util.HashSet<>(java.util.Set.of(AdminPermission.VIEW_USERS)));
        when(adminRepository.findByUserId(userId)).thenReturn(Optional.of(admin));

        Authentication staleMissingGrant = authentication(userId, null);
        assertThat(evaluator.hasPermission(staleMissingGrant, null, "VIEW_USERS")).isTrue();

        admin.revokePermission(AdminPermission.VIEW_USERS);
        Authentication staleGrantedToken = authentication(
                userId,
                null,
                new SimpleGrantedAuthority("VIEW_USERS")
        );
        assertThat(evaluator.hasPermission(staleGrantedToken, null, "VIEW_USERS")).isFalse();
    }

    @Test
    void persistedSuperAdminStillBypassesOwnershipChecks() {
        UUID userId = UUID.randomUUID();
        Admin admin = new Admin(userId, new java.util.HashSet<>(java.util.Set.of(AdminPermission.SUPER_ADMIN)));
        when(adminRepository.findByUserId(userId)).thenReturn(Optional.of(admin));

        assertThat(evaluator.hasPermission(authentication(userId, null), UUID.randomUUID(), "PRODUCT_OWNER"))
                .isTrue();
    }

    private Authentication authentication(UUID userId, UUID supplierId) {
        return authentication(userId, supplierId, new SimpleGrantedAuthority("ROLE_USER"));
    }

    private Authentication authentication(UUID userId, UUID supplierId, SimpleGrantedAuthority authority) {
        UserPrincipal principal = UserPrincipal.builder()
                .userId(userId)
                .supplierId(supplierId)
                .email("test@giftastic.local")
                .password("password")
                .authorities(List.of(authority))
                .build();
        return new UsernamePasswordAuthenticationToken(principal, principal.getPassword(), principal.getAuthorities());
    }
}

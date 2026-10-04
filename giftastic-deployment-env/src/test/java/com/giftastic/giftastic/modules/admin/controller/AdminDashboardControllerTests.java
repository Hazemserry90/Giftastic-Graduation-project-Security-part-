package com.giftastic.giftastic.modules.admin.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.dto.AdminPermissionSummaryResponse;
import com.giftastic.giftastic.modules.admin.service.AdminService;

class AdminDashboardControllerTests {

    @Test
    void getAllAdminsReturnsSafePermissionSummaries() {
        AdminService adminService = mock(AdminService.class);
        UUID userId = UUID.randomUUID();
        List<AdminPermissionSummaryResponse> expected = List.of(
                new AdminPermissionSummaryResponse(userId, Set.of(AdminPermission.VIEW_USERS))
        );
        when(adminService.getAllAdminProfiles()).thenReturn(expected);
        AdminDashboardController controller = new AdminDashboardController(
                null, null, null, null, null, adminService, null, null);

        List<AdminPermissionSummaryResponse> result = controller.getAllAdmins().getBody();

        assertThat(result).isSameAs(expected);
        verify(adminService).getAllAdminProfiles();
    }

    @Test
    void getProductsReturnsEveryStatusWhenStatusIsOmitted() {
        ProductRepository productRepository = mock(ProductRepository.class);
        AdminDashboardController controller = new AdminDashboardController(
                null, null, productRepository, null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Product> expected = Page.empty(pageable);
        when(productRepository.findAll(pageable)).thenReturn(expected);

        Page<Product> result = controller.getProducts(null, pageable).getBody();

        assertThat(result).isSameAs(expected);
        verify(productRepository).findAll(pageable);
    }

    @Test
    void getProductsFiltersByDisabledStatus() {
        ProductRepository productRepository = mock(ProductRepository.class);
        AdminDashboardController controller = new AdminDashboardController(
                null, null, productRepository, null, null, null, null, null);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Product> expected = Page.empty(pageable);
        when(productRepository.findByStatus(ProductStatus.DISABLED, pageable)).thenReturn(expected);

        Page<Product> result = controller.getProducts(ProductStatus.DISABLED, pageable).getBody();

        assertThat(result).isSameAs(expected);
        verify(productRepository).findByStatus(ProductStatus.DISABLED, pageable);
    }
}

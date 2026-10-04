package com.giftastic.giftastic.modules.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.commission.service.CommissionPricingService;

class ProductServiceImplTests {

    @Test
    void updateProductPersistsStockQuantity() {
        ProductRepository productRepository = mock(ProductRepository.class);
        VendorRepository vendorRepository = mock(VendorRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        CommissionPricingService commissionPricingService = mock(CommissionPricingService.class);

        when(commissionPricingService.getApplicableRate(any(UUID.class), any(java.time.LocalDateTime.class)))
                .thenReturn(new BigDecimal("0.10"));

        ProductServiceImpl service = new ProductServiceImpl(
                productRepository,
                vendorRepository,
                notificationService,
                commissionPricingService
        );

        UUID supplierId = UUID.randomUUID();
        Product existing = Product.create(supplierId, "Gift", new BigDecimal("100.00"), "Description");
        Product update = Product.create(supplierId, "Updated Gift", new BigDecimal("120.00"), "Updated description");
        update.updateStock(17);

        when(productRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product saved = service.updateProduct(existing.getId(), update);

        assertThat(saved.getStockQuantity()).isEqualTo(17);
        assertThat(existing.getStockQuantity()).isEqualTo(17);
    }

    @Test
    void disabledProductCanBeSubmittedForReviewAgain() {
        ProductRepository productRepository = mock(ProductRepository.class);
        VendorRepository vendorRepository = mock(VendorRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        CommissionPricingService commissionPricingService = mock(CommissionPricingService.class);

        ProductServiceImpl service = new ProductServiceImpl(
                productRepository,
                vendorRepository,
                notificationService,
                commissionPricingService
        );

        Product product = Product.create(UUID.randomUUID(), "Gift", new BigDecimal("100.00"), "Description");
        product.submitForApproval();
        product.approve();
        product.disable();

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.submitForApproval(product.getId());

        assertThat(product.getStatus()).isEqualTo(ProductStatus.PENDING_APPROVAL);
    }

    @Test
    void pendingProductReviewRequestReturnsClearDuplicateMessage() {
        ProductRepository productRepository = mock(ProductRepository.class);
        VendorRepository vendorRepository = mock(VendorRepository.class);
        NotificationService notificationService = mock(NotificationService.class);
        CommissionPricingService commissionPricingService = mock(CommissionPricingService.class);

        ProductServiceImpl service = new ProductServiceImpl(
                productRepository,
                vendorRepository,
                notificationService,
                commissionPricingService
        );

        Product product = Product.create(UUID.randomUUID(), "Gift", new BigDecimal("100.00"), "Description");
        product.submitForApproval("Please review this product.");

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> service.submitForApproval(product.getId(), "Second request"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("A review request is already pending for this product.");
    }
}
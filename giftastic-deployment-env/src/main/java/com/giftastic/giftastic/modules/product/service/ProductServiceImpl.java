package com.giftastic.giftastic.modules.product.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;

    @Override
    @Transactional
    public Product createProduct(Product product) {
        Product saved = productRepository.save(product);
        notificationService.sendNotification(
            product.getSupplierId(),
            "Product Created",
            "Your product '" + product.getName() + "' has been created and is awaiting submission.",
            NotificationType.VENDOR_ALERT,
            "{\"productId\":\"" + saved.getId() + "\"}"
        );
        return applyCurrentCommission(saved);
    }

    @Override
    @Transactional
    public Product updateProduct(UUID productId, Product product) {
        Product existing = getOrThrow(productId);
        
        existing.update(product.getName(), product.getDescription(), product.getPrice(), product.getDetails());
        existing.updatePricingMode(product.getEffectivePricingMode());
        existing.updateStock(product.getStockQuantity());
        existing.setCategories(product.getCategories());
        
        return applyCurrentCommission(productRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteProduct(UUID productId) {
        productRepository.deleteById(productId);
    }

    @Override
    @Transactional
    public void submitForApproval(UUID productId) {
        submitForApproval(productId, null);
    }

    @Override
    @Transactional
    public void submitForApproval(UUID productId, String message) {
        Product product = getOrThrow(productId);
        if (product.getStatus() == ProductStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("A review request is already pending for this product.");
        }
        product.submitForApproval(message);
        productRepository.save(product);

        notificationService.sendNotification(
            product.getSupplierId(),
            "Review Request Submitted",
            "Your product '" + product.getName() + "' has been sent to Super Admin for review.",
            NotificationType.VENDOR_ALERT,
            "{\"productId\":\"" + productId + "\"}"
        );
    }

    @Override
    @Transactional
    public void approveProduct(UUID productId) {
        Product product = getOrThrow(productId);
        product.approveDirectly(SecurityUtils.getCurrentUserId());
        productRepository.save(product);
        
        notificationService.sendNotification(
            product.getSupplierId(),
            "Product Approved!",
            "Great news! Your product '" + product.getName() + "' has been approved and is now live.",
            NotificationType.VENDOR_ALERT,
            "{\"productId\":\"" + productId + "\"}"
        );
    }

    @Transactional
    @Override
    public void rejectProduct(UUID productId, String reason) {
        Product product = getOrThrow(productId);
        product.reject(reason, SecurityUtils.getCurrentUserId());
        productRepository.save(product);
        
        notificationService.sendNotification(
            product.getSupplierId(),
            "Product Rejected",
            "Your product '" + product.getName() + "' was not approved."
                    + (reason == null || reason.isBlank() ? " Please check your notes and resubmit." : " Reason: " + reason.trim()),
            NotificationType.VENDOR_ALERT,
            "{\"productId\":\"" + productId + "\"}"
        );
    }

    @Transactional
    @Override
    public void disableProduct(UUID productId) {
        Product product = getOrThrow(productId);
        product.disable();
        productRepository.save(product);
    }

    @Transactional
    @Override
    public void enableProduct(UUID productId) {
        Product product = getOrThrow(productId);
        product.enable();
        productRepository.save(product);
    }

    @Override
    public Product getOrThrow(UUID productId) {
        return applyCurrentCommission(productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found")));
    }

    @Override
    public Page<Product> getDiscoverableProducts(Pageable pageable) {
        return productRepository.findDiscoverableByStatus(ProductStatus.APPROVED, pageable)
                .map(this::applyCurrentCommission);
    }

    @Override
    public List<Product> getProductsForSupplier(UUID supplierId) {
        return productRepository.findBySupplierId(supplierId).stream().map(this::applyCurrentCommission).toList();
    }

    @Override
    public List<Product> getDiscoverableProductsForSupplier(UUID supplierId) {
        if (!isSupplierDiscoverable(supplierId)) {
            return List.of();
        }
        return productRepository.findBySupplierId(supplierId).stream()
                .filter(this::isProductDiscoverable)
                .map(this::applyCurrentCommission)
                .toList();
    }

    @Override
    public Page<Product> searchProducts(String query, Pageable pageable) {
        return productRepository.findDiscoverableByStatusAndNameContainingIgnoreCase(ProductStatus.APPROVED, query, pageable)
                .map(this::applyCurrentCommission);
    }

    @Override
    public Product getProductForViewing(UUID productId) { 
        return getOrThrow(productId); 
    }

    @Override
    public boolean isProductDiscoverable(Product product) {
        return product != null
                && product.getStatus() == ProductStatus.APPROVED
                && isSupplierDiscoverable(product.getSupplierId());
    }
    
    @Override
    @Transactional
    public void updateStock(UUID productId, Integer stockQuantity) {
        Product product = getOrThrow(productId);
        product.updateStock(stockQuantity);
        productRepository.save(product);
        
        notificationService.sendNotification(
            product.getSupplierId(),
            "Stock Updated",
            "Stock for '" + product.getName() + "' has been updated to " + stockQuantity + " units.",
            NotificationType.VENDOR_ALERT,
            "{\"productId\":\"" + productId + "\",\"stockQuantity\":" + stockQuantity + "}"
        );
    }
    
    @Override
    public boolean checkStock(UUID productId, int quantity) {
        Product product = getOrThrow(productId);
        return product.hasStock(quantity);
    }

    private Product applyCurrentCommission(Product product) {
        product.applyCommissionRate(commissionPricingService.getApplicableRate(
                product.getSupplierId(), java.time.LocalDateTime.now()));
        return product;
    }

    private boolean isSupplierDiscoverable(UUID supplierId) {
        return supplierId != null
                && vendorRepository.findBySupplierId(supplierId)
                .map(com.giftastic.giftastic.modules.vendor.domain.Vendor::isVerified)
                .orElse(false);
    }
}

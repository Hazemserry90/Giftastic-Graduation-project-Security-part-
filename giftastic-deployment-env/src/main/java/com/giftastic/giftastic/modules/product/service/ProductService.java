package com.giftastic.giftastic.modules.product.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.giftastic.giftastic.modules.product.domain.Product;

import jakarta.transaction.Transactional;

public interface ProductService {

    Product createProduct(Product product);
    
    Product updateProduct(UUID productId, Product product);

    void deleteProduct(UUID productId);

    void submitForApproval(UUID productId);

    void submitForApproval(UUID productId, String message);

    void approveProduct(UUID productId);

    Product getOrThrow(UUID productId);

    @Transactional
    void rejectProduct(UUID productId, String reason);
    
    void disableProduct(UUID productId);
    
    void enableProduct(UUID productId);
    
    Page<Product> getDiscoverableProducts(Pageable pageable);

    List<Product> getProductsForSupplier(UUID supplierId);

    List<Product> getDiscoverableProductsForSupplier(UUID supplierId);
    
    Page<Product> searchProducts(String query, Pageable pageable);

    Product getProductForViewing(UUID productId);

    boolean isProductDiscoverable(Product product);
    
    void updateStock(UUID productId, Integer stockQuantity);
    
    boolean checkStock(UUID productId, int quantity);
}

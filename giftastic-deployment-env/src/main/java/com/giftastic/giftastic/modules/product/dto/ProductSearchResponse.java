package com.giftastic.giftastic.modules.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;

public record ProductSearchResponse(
    UUID id,
    String name,
    String description,
    BigDecimal originalPrice,
    BigDecimal currentPrice,
    VendorPricingMode pricingMode,
    BigDecimal discountPercentage,
    boolean hasActiveDiscount,
    Integer stockQuantity,
    boolean inStock,
    BigDecimal averageRating,
    Integer reviewCount,
    String primaryImageUrl,
    UUID supplierId,
    LocalDateTime createdAt
) {
    public static ProductSearchResponse from(Product product) {
        String primaryImage = product.getImages().stream()
            .filter(img -> img.isPrimary())
            .findFirst()
            .map(img -> img.getUrl())
            .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getUrl());
        
        return new ProductSearchResponse(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getCustomerOriginalPrice(),
            product.getCustomerPrice(),
            product.getEffectivePricingMode(),
            product.hasActiveDiscount() ? product.getDiscountPercentage() : BigDecimal.ZERO,
            product.hasActiveDiscount(),
            product.getStockQuantity(),
            product.isInStock(),
            product.getAverageRating(),
            product.getReviewCount(),
            primaryImage,
            product.getSupplierId(),
            product.getCreatedAt()
        );
    }
}

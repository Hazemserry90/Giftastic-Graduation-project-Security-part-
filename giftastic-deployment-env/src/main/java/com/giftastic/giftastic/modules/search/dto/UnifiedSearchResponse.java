package com.giftastic.giftastic.modules.search.dto;

import java.util.List;

public record UnifiedSearchResponse(
    List<ProductSearchResult> products,
    List<VendorSearchResult> vendors,
    List<GiftFlowSearchResult> giftFlows,
    int totalResults
) {
    public record ProductSearchResult(
        java.util.UUID id,
        String name,
        String description,
        java.math.BigDecimal price,
        java.math.BigDecimal discountedPrice,
        boolean hasDiscount,
        String imageUrl
    ) {}
    
    public record VendorSearchResult(
        java.util.UUID id,
        String storeName,
        String description,
        String logoUrl
    ) {}
    
    public record GiftFlowSearchResult(
        java.util.UUID id,
        String name,
        String description,
        String imageUrl
    ) {}
}

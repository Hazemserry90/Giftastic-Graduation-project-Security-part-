package com.giftastic.giftastic.modules.product.service;

import org.springframework.data.domain.Page;

import com.giftastic.giftastic.modules.product.dto.ProductSearchRequest;
import com.giftastic.giftastic.modules.product.dto.ProductSearchResponse;

public interface ProductSearchService {
    Page<ProductSearchResponse> search(ProductSearchRequest request);
    void invalidateCache();
    void invalidateCacheForProduct(java.util.UUID productId);
}

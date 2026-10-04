package com.giftastic.giftastic.modules.product.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductSearchRequest(
    String query,
    List<UUID> categoryIds,
    BigDecimal minPrice,
    BigDecimal maxPrice,
    Boolean inStockOnly,
    Boolean onSaleOnly,
    String sortBy, // price_asc, price_desc, rating, newest, popular
    Integer page,
    Integer size
) {
    public ProductSearchRequest {
        page = page != null && page >= 0 ? page : 0;
        size = size != null && size > 0 && size <= 100 ? size : 20;
    }
}

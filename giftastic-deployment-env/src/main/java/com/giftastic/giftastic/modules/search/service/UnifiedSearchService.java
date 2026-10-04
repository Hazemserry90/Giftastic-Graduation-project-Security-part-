package com.giftastic.giftastic.modules.search.service;

import com.giftastic.giftastic.modules.search.dto.UnifiedSearchResponse;

public interface UnifiedSearchService {
    UnifiedSearchResponse search(String query, int limit);
}

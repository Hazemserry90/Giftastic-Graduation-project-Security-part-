package com.giftastic.giftastic.modules.ai.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.product.domain.Product;

/**
 * AI Domain interface for computing Gift Recommendations.
 * Abstractly separate from underlying ML architecture (Vector DBs / RAG / basic heuristic).
 * 
 * This interface allows multiple implementations:
 * - HeuristicRecommendationEngine: Rule-based with customer history
 * - MLRecommendationEngine: Machine learning based (future)
 * - HybridRecommendationEngine: Combination of multiple strategies (future)
 */
public interface RecommendationEngine {

    /**
     * Compute personalized recommendations for a user based on their history.
     * Uses past orders, favorites, cart items, and browsing patterns.
     * 
     * @param customerId The customer to generate recommendations for
     * @param limit Maximum number of recommendations to return
     * @return List of recommended products, ordered by relevance
     */
    List<Product> recommendForUser(UUID customerId, int limit);

    /**
     * Retrieve products matching explicit heuristic filtering metrics or text tags.
     * Acts as a fallback or hybrid source for pure AI layers.
     * 
     * @param tags List of tags/keywords to match
     * @param limit Maximum number of products to return
     * @return List of matching products
     */
    List<Product> recommendBasedOnTags(List<String> tags, int limit);

    /**
     * Get trending/popular products across the platform.
     * Useful for new users without history or as a fallback.
     * 
     * @param limit Maximum number of products to return
     * @return List of trending products
     */
    List<Product> getTrendingProducts(int limit);

    /**
     * Get similar products based on a given product.
     * Uses categories, price range, and other attributes.
     * 
     * @param productId The reference product
     * @param limit Maximum number of similar products to return
     * @return List of similar products
     */
    List<Product> getSimilarProducts(UUID productId, int limit);

    /**
     * Get the name/type of this recommendation engine implementation.
     * Useful for logging, monitoring, and A/B testing.
     * 
     * @return Engine name (e.g., "heuristic", "ml", "hybrid")
     */
    String getEngineName();

    /**
     * Get the featured product for a specific date.
     * Uses deterministic algorithm based on date to ensure consistency.
     * Same date always returns the same product (good for caching).
     * 
     * @param date The date to get featured product for
     * @return Featured product for that date, or null if none available
     */
    Product getProductOfTheDay(java.time.LocalDate date);

    /**
     * Get the featured vendor for a specific date.
     * Uses deterministic algorithm based on date to ensure consistency.
     * 
     * @param date The date to get featured vendor for
     * @return Featured vendor for that date, or null if none available
     */
    com.giftastic.giftastic.modules.vendor.domain.Vendor getVendorOfTheDay(java.time.LocalDate date);

    /**
     * Get the featured gift flow for a specific date.
     * Uses deterministic algorithm based on date to ensure consistency.
     * 
     * @param date The date to get featured flow for
     * @return Featured gift flow for that date, or null if none available
     */
    com.giftastic.giftastic.modules.flow.domain.GiftFlow getFlowOfTheDay(java.time.LocalDate date);

    /**
     * Get most frequently bought products based on actual order data.
     * Analyzes order history to find products that appear most often.
     * 
     * @param limit Maximum number of products to return
     * @return List of most frequently purchased products
     */
    List<Product> getMostFrequentlyBought(int limit);

    /**
     * Get what others are buying - recent popular purchases.
     * Shows products that have been purchased recently and frequently.
     * 
     * @param limit Maximum number of products to return
     * @return List of recently popular products
     */
    List<Product> getWhatOthersAreBuying(int limit);
}

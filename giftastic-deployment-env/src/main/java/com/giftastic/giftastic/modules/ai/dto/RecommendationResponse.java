package com.giftastic.giftastic.modules.ai.dto;

import java.util.List;

import com.giftastic.giftastic.modules.product.domain.Product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for product recommendations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    
    /**
     * List of recommended products.
     */
    private List<Product> products;
    
    /**
     * The recommendation engine used to generate these results.
     */
    private String engine;
    
    /**
     * The strategy/reason for these recommendations.
     * Examples: "personalized", "trending", "similar", "tag-based"
     */
    private String strategy;
    
    /**
     * Total number of recommendations returned.
     */
    private int count;
}

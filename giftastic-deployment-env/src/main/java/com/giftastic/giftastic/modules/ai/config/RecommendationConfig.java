package com.giftastic.giftastic.modules.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.giftastic.giftastic.modules.ai.service.HeuristicRecommendationEngine;
import com.giftastic.giftastic.modules.ai.service.RecommendationEngine;

/**
 * Configuration for the recommendation system.
 * 
 * To switch recommendation engines:
 * 1. Create a new implementation of RecommendationEngine (e.g., MLRecommendationEngine)
 * 2. Change the @Primary annotation to point to your new implementation
 * 3. Or use @Profile to switch based on environment
 * 
 * Example for future ML engine:
 * 
 * @Bean
 * @Primary
 * @Profile("production")
 * public RecommendationEngine mlRecommendationEngine(...) {
 *     return new MLRecommendationEngine(...);
 * }
 * 
 * @Bean
 * @Profile("development")
 * public RecommendationEngine heuristicEngine(...) {
 *     return heuristicRecommendationEngine;
 * }
 */
@Configuration
public class RecommendationConfig {

    /**
     * Primary recommendation engine bean.
     * Currently using heuristic-based recommendations.
     * 
     * To switch to a different engine, change this method or use profiles.
     */
    @Bean
    @Primary
    public RecommendationEngine recommendationEngine(HeuristicRecommendationEngine heuristicEngine) {
        // Return the heuristic engine as default
        // In the future, you can inject and return different implementations here
        return heuristicEngine;
    }
}

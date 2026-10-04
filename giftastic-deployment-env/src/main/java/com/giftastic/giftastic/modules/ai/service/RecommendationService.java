package com.giftastic.giftastic.modules.ai.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.product.domain.Product;

import lombok.extern.slf4j.Slf4j;

/**
 * Facade service for product recommendations.
 * Delegates to the configured RecommendationEngine implementation.
 * 
 * This allows easy switching between different recommendation strategies:
 * - Heuristic (current default)
 * - Machine Learning (future)
 * - Hybrid (future)
 * 
 * To switch implementations, simply change the injected bean in RecommendationConfig.
 */
@Slf4j
@Service
public class RecommendationService {

    private final RecommendationEngine engine;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;

    public RecommendationService(RecommendationEngine engine,
            com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService) {
        this.engine = engine;
        this.commissionPricingService = commissionPricingService;
        log.info("RecommendationService initialized with engine: {}", engine.getEngineName());
    }

    /**
     * Get personalized product recommendations for a user.
     */
    public List<Product> getRecommendationsForUser(UUID customerId, int limit) {
        log.debug("Getting recommendations for user {} using {} engine", customerId, engine.getEngineName());
        return price(engine.recommendForUser(customerId, limit));
    }

    /**
     * Get products matching specific tags/keywords.
     */
    public List<Product> getRecommendationsByTags(List<String> tags, int limit) {
        log.debug("Getting recommendations by tags: {}", tags);
        return price(engine.recommendBasedOnTags(tags, limit));
    }

    /**
     * Get trending/popular products.
     */
    public List<Product> getTrendingProducts(int limit) {
        log.debug("Getting trending products");
        return price(engine.getTrendingProducts(limit));
    }

    /**
     * Get products similar to a given product.
     */
    public List<Product> getSimilarProducts(UUID productId, int limit) {
        log.debug("Getting similar products to: {}", productId);
        return price(engine.getSimilarProducts(productId, limit));
    }

    /**
     * Get the name of the currently active recommendation engine.
     */
    public String getActiveEngineName() {
        return engine.getEngineName();
    }

    /**
     * Get the featured product for today.
     */
    public Product getProductOfTheDay() {
        return getProductOfTheDay(java.time.LocalDate.now());
    }

    /**
     * Get the featured product for a specific date.
     */
    public Product getProductOfTheDay(java.time.LocalDate date) {
        log.debug("Getting product of the day for {} using {} engine", date, engine.getEngineName());
        return price(engine.getProductOfTheDay(date));
    }

    /**
     * Get the featured vendor for today.
     */
    public com.giftastic.giftastic.modules.vendor.domain.Vendor getVendorOfTheDay() {
        return getVendorOfTheDay(java.time.LocalDate.now());
    }

    /**
     * Get the featured vendor for a specific date.
     */
    public com.giftastic.giftastic.modules.vendor.domain.Vendor getVendorOfTheDay(java.time.LocalDate date) {
        log.debug("Getting vendor of the day for {} using {} engine", date, engine.getEngineName());
        return engine.getVendorOfTheDay(date);
    }

    /**
     * Get the featured gift flow for today.
     */
    public com.giftastic.giftastic.modules.flow.domain.GiftFlow getFlowOfTheDay() {
        return getFlowOfTheDay(java.time.LocalDate.now());
    }

    /**
     * Get the featured gift flow for a specific date.
     */
    public com.giftastic.giftastic.modules.flow.domain.GiftFlow getFlowOfTheDay(java.time.LocalDate date) {
        log.debug("Getting flow of the day for {} using {} engine", date, engine.getEngineName());
        return engine.getFlowOfTheDay(date);
    }

    /**
     * Get most frequently bought products based on actual order data.
     */
    public List<Product> getMostFrequentlyBought(int limit) {
        log.debug("Getting most frequently bought products");
        return price(engine.getMostFrequentlyBought(limit));
    }

    /**
     * Get what others are buying - recent popular purchases.
     */
    public List<Product> getWhatOthersAreBuying(int limit) {
        log.debug("Getting what others are buying");
        return price(engine.getWhatOthersAreBuying(limit));
    }

    private List<Product> price(List<Product> products) {
        products.forEach(this::price);
        return products;
    }

    private Product price(Product product) {
        if (product != null) product.applyCommissionRate(commissionPricingService.getApplicableRate(
                product.getSupplierId(), java.time.LocalDateTime.now()));
        return product;
    }
}

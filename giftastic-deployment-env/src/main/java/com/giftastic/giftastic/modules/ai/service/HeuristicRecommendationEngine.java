package com.giftastic.giftastic.modules.ai.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.category.domain.Category;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.user.domain.FavoriteProduct;
import com.giftastic.giftastic.modules.user.repository.FavoriteProductRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Heuristic-based recommendation engine using customer history and randomization.
 * 
 * Strategy:
 * 1. Analyze customer's past orders to identify preferred categories
 * 2. Check customer's favorites for additional signals
 * 3. Use weighted randomization to add variety
 * 4. Fall back to trending products for new users
 * 
 * This implementation can be easily replaced with ML-based engines in the future.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HeuristicRecommendationEngine implements RecommendationEngine {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final FavoriteProductRepository favoriteProductRepository;
    private final com.giftastic.giftastic.modules.vendor.repository.VendorRepository vendorRepository;
    private final com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository giftFlowRepository;
    private final Random random = new Random();

    @Override
    public List<Product> recommendForUser(UUID customerId, int limit) {
        log.debug("Generating heuristic recommendations for customer: {}", customerId);
        
        // Get customer's purchase history
        List<Order> pastOrders = orderRepository.findByCustomerId(customerId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        
        // Get customer's favorites
        List<FavoriteProduct> favorites = favoriteProductRepository.findByUserId(customerId);
        
        // Extract preferred categories from history
        Set<UUID> preferredCategoryIds = extractPreferredCategories(pastOrders, favorites);
        
        // Get products already purchased or favorited (to exclude)
        Set<UUID> excludeProductIds = extractPurchasedAndFavoritedProducts(pastOrders, favorites);
        
        List<Product> recommendations = new ArrayList<>();
        
        if (!preferredCategoryIds.isEmpty()) {
            // Strategy 1: Products from preferred categories (70% weight)
            List<Product> categoryBasedProducts = getProductsFromCategories(preferredCategoryIds, excludeProductIds, limit);
            recommendations.addAll(categoryBasedProducts);
        }
        
        // Strategy 2: Add some randomization for discovery (30% weight)
        if (recommendations.size() < limit) {
            int remainingSlots = limit - recommendations.size();
            List<Product> randomProducts = getRandomApprovedProducts(excludeProductIds, remainingSlots);
            recommendations.addAll(randomProducts);
        }
        
        // Fallback: If still not enough, use trending products
        if (recommendations.isEmpty()) {
            log.debug("No history found for customer {}, falling back to trending products", customerId);
            return getTrendingProducts(limit);
        }
        
        // Shuffle to add variety and limit to requested size
        Collections.shuffle(recommendations, random);
        return recommendations.stream().limit(limit).collect(Collectors.toList());
    }

    @Override
    public List<Product> recommendBasedOnTags(List<String> tags, int limit) {
        if (tags == null || tags.isEmpty()) {
            return Collections.emptyList();
        }
        
        log.debug("Searching products by tags: {}", tags);
        
        // Search products by name or description containing tags
        List<Product> matchingProducts = new ArrayList<>();
        
        for (String tag : tags) {
            List<Product> tagMatches = productRepository.findDiscoverableByStatusAndNameContainingIgnoreCase(
                ProductStatus.APPROVED,
                tag,
                org.springframework.data.domain.PageRequest.of(0, limit)
            ).getContent();
            matchingProducts.addAll(tagMatches);
        }
        
        // Remove duplicates and limit
        return matchingProducts.stream()
            .distinct()
            .limit(limit)
            .collect(Collectors.toList());
    }

    @Override
    public List<Product> getTrendingProducts(int limit) {
        log.debug("Fetching trending products");
        
        // Strategy: Get recently published products with good ratings
        // Sort by: 1) Average rating, 2) Review count, 3) Recently published
        List<Product> allApproved = productRepository.findDiscoverableByStatus(
            ProductStatus.APPROVED,
            org.springframework.data.domain.PageRequest.of(0, limit * 3) // Get more for better filtering
        ).getContent();
        
        return allApproved.stream()
            .sorted(Comparator
                .comparing(Product::getAverageRating).reversed()
                .thenComparing(Product::getReviewCount).reversed()
                .thenComparing(Product::getPublishedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            )
            .limit(limit)
            .collect(Collectors.toList());
    }

    @Override
    public List<Product> getSimilarProducts(UUID productId, int limit) {
        log.debug("Finding similar products to: {}", productId);
        
        Product referenceProduct = productRepository.findById(productId).orElse(null);
        if (referenceProduct == null) {
            return Collections.emptyList();
        }
        
        // Extract category IDs from reference product
        Set<UUID> categoryIds = referenceProduct.getCategories().stream()
            .map(Category::getId)
            .collect(Collectors.toSet());
        
        if (categoryIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Find products in same categories, excluding the reference product
        Set<UUID> excludeIds = Set.of(productId);
        List<Product> similarProducts = getProductsFromCategories(categoryIds, excludeIds, limit * 2);
        
        // Filter by similar price range (±30%)
        java.math.BigDecimal refPrice = referenceProduct.getPrice();
        java.math.BigDecimal lowerBound = refPrice.multiply(java.math.BigDecimal.valueOf(0.7));
        java.math.BigDecimal upperBound = refPrice.multiply(java.math.BigDecimal.valueOf(1.3));
        
        return similarProducts.stream()
            .filter(p -> p.getPrice().compareTo(lowerBound) >= 0 && p.getPrice().compareTo(upperBound) <= 0)
            .limit(limit)
            .collect(Collectors.toList());
    }

    @Override
    public String getEngineName() {
        return "heuristic";
    }

    @Override
    public Product getProductOfTheDay(java.time.LocalDate date) {
        log.debug("Selecting product of the day for: {}", date);
        
        // Use date as seed for deterministic selection
        // Same date = same product (good for caching and consistency)
        Random dateRandom = new Random(date.toEpochDay());
        
        // Get top trending products
        List<Product> trendingProducts = getTrendingProducts(50);
        
        if (trendingProducts.isEmpty()) {
            log.warn("No products available for product of the day");
            return null;
        }
        
        // Select from top 10 using date-based randomization
        int poolSize = Math.min(10, trendingProducts.size());
        int selectedIndex = dateRandom.nextInt(poolSize);
        
        Product selected = trendingProducts.get(selectedIndex);
        log.info("Product of the day for {}: {} ({})", date, selected.getName(), selected.getId());
        
        return selected;
    }

    @Override
    public com.giftastic.giftastic.modules.vendor.domain.Vendor getVendorOfTheDay(java.time.LocalDate date) {
        log.debug("Selecting vendor of the day for: {}", date);
        
        // Use date as seed for deterministic selection
        Random dateRandom = new Random(date.toEpochDay());
        
        // Get all verified vendors
        List<com.giftastic.giftastic.modules.vendor.domain.Vendor> verifiedVendors = 
            vendorRepository.findByIsVerifiedTrue();
        
        if (verifiedVendors.isEmpty()) {
            log.warn("No verified vendors available for vendor of the day");
            return null;
        }
        
        // Sort by number of approved products (vendors with more products get higher chance)
        List<com.giftastic.giftastic.modules.vendor.domain.Vendor> sortedVendors = verifiedVendors.stream()
            .sorted((v1, v2) -> {
                long count1 = productRepository.findBySupplierId(v1.getSupplierId()).stream()
                    .filter(this::isDiscoverableProduct)
                    .count();
                long count2 = productRepository.findBySupplierId(v2.getSupplierId()).stream()
                    .filter(this::isDiscoverableProduct)
                    .count();
                return Long.compare(count2, count1); // Descending
            })
            .collect(Collectors.toList());
        
        // Select from top 10 vendors
        int poolSize = Math.min(10, sortedVendors.size());
        int selectedIndex = dateRandom.nextInt(poolSize);
        
        com.giftastic.giftastic.modules.vendor.domain.Vendor selected = sortedVendors.get(selectedIndex);
        log.info("Vendor of the day for {}: {} ({})", date, selected.getStoreName(), selected.getSupplierId());
        
        return selected;
    }

    @Override
    public com.giftastic.giftastic.modules.flow.domain.GiftFlow getFlowOfTheDay(java.time.LocalDate date) {
        log.debug("Selecting gift flow of the day for: {}", date);
        
        // Use date as seed for deterministic selection
        Random dateRandom = new Random(date.toEpochDay());
        
        // Get all gift flows
        List<com.giftastic.giftastic.modules.flow.domain.GiftFlow> allFlows = giftFlowRepository.findAll();
        
        if (allFlows.isEmpty()) {
            log.warn("No gift flows available for flow of the day");
            return null;
        }
        
        // Filter to only flows with valid products
        List<com.giftastic.giftastic.modules.flow.domain.GiftFlow> validFlows = allFlows.stream()
            .filter(flow -> {
                // Check if flow has at least one valid product
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode config = mapper.readTree(flow.getConfiguration());
                    com.fasterxml.jackson.databind.JsonNode steps = config.get("steps");
                    
                    if (steps != null && steps.isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode step : steps) {
                            com.fasterxml.jackson.databind.JsonNode products = step.get("products");
                            if (products != null && products.isArray() && products.size() > 0) {
                                return true;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("Failed to parse flow configuration for {}", flow.getId());
                }
                return false;
            })
            .collect(Collectors.toList());
        
        if (validFlows.isEmpty()) {
            log.warn("No valid gift flows available for flow of the day");
            return null;
        }
        
        // Select randomly from valid flows
        int selectedIndex = dateRandom.nextInt(validFlows.size());
        
        com.giftastic.giftastic.modules.flow.domain.GiftFlow selected = validFlows.get(selectedIndex);
        log.info("Gift flow of the day for {}: {} ({})", date, selected.getName(), selected.getId());
        
        return selected;
    }

    // ========== Private Helper Methods ==========

    private Set<UUID> extractPreferredCategories(List<Order> orders, List<FavoriteProduct> favorites) {
        Set<UUID> categoryIds = new HashSet<>();
        
        // Extract categories from past orders
        for (Order order : orders) {
            order.getItems().forEach(item -> {
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null) {
                    product.getCategories().forEach(cat -> categoryIds.add(cat.getId()));
                }
            });
        }
        
        // Extract categories from favorites
        for (FavoriteProduct fav : favorites) {
            if (fav.getProductId() != null) {
                Product product = productRepository.findById(fav.getProductId()).orElse(null);
                if (product != null) {
                    product.getCategories().forEach(cat -> categoryIds.add(cat.getId()));
                }
            }
        }
        
        return categoryIds;
    }

    private Set<UUID> extractPurchasedAndFavoritedProducts(List<Order> orders, List<FavoriteProduct> favorites) {
        Set<UUID> productIds = new HashSet<>();
        
        // Add purchased products
        orders.forEach(order -> 
            order.getItems().forEach(item -> productIds.add(item.getProductId()))
        );
        
        // Add favorited products
        favorites.forEach(fav -> {
            if (fav.getProductId() != null) {
                productIds.add(fav.getProductId());
            }
        });
        
        return productIds;
    }

    private List<Product> getProductsFromCategories(Set<UUID> categoryIds, Set<UUID> excludeProductIds, int limit) {
        List<Product> products = new ArrayList<>();
        
        for (UUID categoryId : categoryIds) {
            // Get products from this category
            List<Product> categoryProducts = productRepository.findDiscoverableByStatus(ProductStatus.APPROVED).stream()
                .filter(p -> !excludeProductIds.contains(p.getId()))
                .filter(p -> p.getCategories().stream().anyMatch(cat -> cat.getId().equals(categoryId)))
                .collect(Collectors.toList());
            
            products.addAll(categoryProducts);
            
            if (products.size() >= limit) {
                break;
            }
        }
        
        return products.stream().distinct().limit(limit).collect(Collectors.toList());
    }

    private List<Product> getRandomApprovedProducts(Set<UUID> excludeProductIds, int limit) {
        List<Product> allApproved = productRepository.findDiscoverableByStatus(
            ProductStatus.APPROVED,
            org.springframework.data.domain.PageRequest.of(0, limit * 3)
        ).getContent();
        
        List<Product> filtered = allApproved.stream()
            .filter(p -> !excludeProductIds.contains(p.getId()))
            .collect(Collectors.toList());
        
        Collections.shuffle(filtered, random);
        return filtered.stream().limit(limit).collect(Collectors.toList());
    }

    @Override
    public List<Product> getMostFrequentlyBought(int limit) {
        log.debug("Finding most frequently bought products");
        
        // Get all completed orders
        List<Order> allOrders = orderRepository.findAll();
        
        if (allOrders.isEmpty()) {
            log.debug("No orders found, returning trending products as fallback");
            return getTrendingProducts(limit);
        }
        
        // Count product occurrences across all orders
        java.util.Map<UUID, Long> productCounts = new java.util.HashMap<>();
        
        for (Order order : allOrders) {
            for (com.giftastic.giftastic.modules.order.domain.OrderItem item : order.getItems()) {
                UUID productId = item.getProductId();
                productCounts.put(productId, productCounts.getOrDefault(productId, 0L) + item.getQuantity());
            }
        }
        
        // Sort by count and get top products
        List<UUID> topProductIds = productCounts.entrySet().stream()
            .sorted(java.util.Map.Entry.<UUID, Long>comparingByValue().reversed())
            .limit(limit * 2) // Get more to account for unavailable products
            .map(java.util.Map.Entry::getKey)
            .collect(Collectors.toList());
        
        // Fetch products and filter to approved only
        List<Product> products = new ArrayList<>();
        for (UUID productId : topProductIds) {
            productRepository.findById(productId).ifPresent(product -> {
                if (isDiscoverableProduct(product) && product.isInStock()) {
                    products.add(product);
                }
            });
            
            if (products.size() >= limit) {
                break;
            }
        }
        
        log.info("Found {} most frequently bought products", products.size());
        return products;
    }

    @Override
    public List<Product> getWhatOthersAreBuying(int limit) {
        log.debug("Finding what others are buying recently");
        
        // Get recent orders (last 30 days)
        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
        
        List<Order> recentOrders = orderRepository.findAll().stream()
            .filter(order -> order.getPlacedAt().isAfter(thirtyDaysAgo))
            .collect(Collectors.toList());
        
        if (recentOrders.isEmpty()) {
            log.debug("No recent orders found, falling back to most frequently bought");
            return getMostFrequentlyBought(limit);
        }
        
        // Count product occurrences in recent orders
        java.util.Map<UUID, Long> productCounts = new java.util.HashMap<>();
        
        for (Order order : recentOrders) {
            for (com.giftastic.giftastic.modules.order.domain.OrderItem item : order.getItems()) {
                UUID productId = item.getProductId();
                productCounts.put(productId, productCounts.getOrDefault(productId, 0L) + item.getQuantity());
            }
        }
        
        // Sort by count and get top products
        List<UUID> topProductIds = productCounts.entrySet().stream()
            .sorted(java.util.Map.Entry.<UUID, Long>comparingByValue().reversed())
            .limit(limit * 2)
            .map(java.util.Map.Entry::getKey)
            .collect(Collectors.toList());
        
        // Fetch products and filter to approved only
        List<Product> products = new ArrayList<>();
        for (UUID productId : topProductIds) {
            productRepository.findById(productId).ifPresent(product -> {
                if (isDiscoverableProduct(product) && product.isInStock()) {
                    products.add(product);
                }
            });
            
            if (products.size() >= limit) {
                break;
            }
        }
        
        log.info("Found {} products that others are buying recently", products.size());
        return products;
    }

    private boolean isDiscoverableProduct(Product product) {
        return product != null
                && product.getStatus() == ProductStatus.APPROVED
                && product.getSupplierId() != null
                && vendorRepository.findBySupplierId(product.getSupplierId())
                .map(Vendor::isVerified)
                .orElse(false);
    }
}

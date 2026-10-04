package com.giftastic.giftastic.modules.ai.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.ai.dto.RecommendationResponse;
import com.giftastic.giftastic.modules.ai.service.RecommendationService;
import com.giftastic.giftastic.modules.product.domain.Product;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "AI-powered product recommendation endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/for-me")
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Get personalized recommendations",
        description = "Returns personalized product recommendations based on your purchase history, favorites, and browsing behavior."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Recommendations generated successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<RecommendationResponse> getPersonalizedRecommendations(
            @Parameter(description = "Maximum number of recommendations to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        UUID customerId = SecurityUtils.getCurrentUserId();
        List<Product> products = recommendationService.getRecommendationsForUser(customerId, limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("personalized")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/for-user/{userId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(#userId, 'USER_OWNER')")
    @Operation(
        summary = "Get recommendations for a specific user",
        description = "Returns personalized recommendations for a specific user. Requires admin permission or user ownership."
    )
    public ResponseEntity<RecommendationResponse> getRecommendationsForUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getRecommendationsForUser(userId, limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("personalized")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trending")
    @Operation(
        summary = "Get trending products",
        description = "Returns currently trending/popular products across the platform. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Trending products retrieved successfully")
    })
    public ResponseEntity<RecommendationResponse> getTrendingProducts(
            @Parameter(description = "Maximum number of products to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getTrendingProducts(limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("trending")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/similar/{productId}")
    @Operation(
        summary = "Get similar products",
        description = "Returns products similar to the specified product based on categories, price range, and attributes. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Similar products retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Reference product not found")
    })
    public ResponseEntity<RecommendationResponse> getSimilarProducts(
            @Parameter(description = "ID of the reference product", required = true)
            @PathVariable UUID productId,
            @Parameter(description = "Maximum number of similar products to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getSimilarProducts(productId, limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("similar")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-tags")
    @Operation(
        summary = "Get recommendations by tags",
        description = "Returns products matching the specified tags/keywords. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Products retrieved successfully")
    })
    public ResponseEntity<RecommendationResponse> getRecommendationsByTags(
            @Parameter(description = "Comma-separated list of tags/keywords", example = "birthday,chocolate,luxury")
            @RequestParam List<String> tags,
            @Parameter(description = "Maximum number of products to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getRecommendationsByTags(tags, limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("tag-based")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/engine-info")
    @Operation(
        summary = "Get active recommendation engine info",
        description = "Returns information about the currently active recommendation engine. Useful for debugging and monitoring."
    )
    public ResponseEntity<String> getEngineInfo() {
        return ResponseEntity.ok(recommendationService.getActiveEngineName());
    }

    @GetMapping("/product-of-the-day")
    @Operation(
        summary = "Get product of the day",
        description = "Returns the featured product for today. Uses deterministic algorithm so same day always returns same product. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Product of the day retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "No product available for today")
    })
    public ResponseEntity<Product> getProductOfTheDay(
            @Parameter(description = "Optional date (YYYY-MM-DD). Defaults to today.", example = "2024-01-20")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        
        java.time.LocalDate targetDate = date != null ? date : java.time.LocalDate.now();
        Product product = recommendationService.getProductOfTheDay(targetDate);
        
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(product);
    }

    @GetMapping("/vendor-of-the-day")
    @Operation(
        summary = "Get vendor of the day",
        description = "Returns the featured vendor for today. Uses deterministic algorithm so same day always returns same vendor. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vendor of the day retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "No vendor available for today")
    })
    public ResponseEntity<com.giftastic.giftastic.modules.vendor.domain.Vendor> getVendorOfTheDay(
            @Parameter(description = "Optional date (YYYY-MM-DD). Defaults to today.", example = "2024-01-20")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        
        java.time.LocalDate targetDate = date != null ? date : java.time.LocalDate.now();
        com.giftastic.giftastic.modules.vendor.domain.Vendor vendor = recommendationService.getVendorOfTheDay(targetDate);
        
        if (vendor == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(vendor);
    }

    @GetMapping("/flow-of-the-day")
    @Operation(
        summary = "Get gift flow of the day",
        description = "Returns the featured gift flow for today. Uses deterministic algorithm so same day always returns same flow. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Gift flow of the day retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "No gift flow available for today")
    })
    public ResponseEntity<com.giftastic.giftastic.modules.flow.domain.GiftFlow> getFlowOfTheDay(
            @Parameter(description = "Optional date (YYYY-MM-DD). Defaults to today.", example = "2024-01-20")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        
        java.time.LocalDate targetDate = date != null ? date : java.time.LocalDate.now();
        com.giftastic.giftastic.modules.flow.domain.GiftFlow flow = recommendationService.getFlowOfTheDay(targetDate);
        
        if (flow == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(flow);
    }

    @GetMapping("/most-frequently-bought")
    @Operation(
        summary = "Get most frequently bought products",
        description = "Returns products that have been purchased most often across all orders. Based on actual order data. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Most frequently bought products retrieved successfully")
    })
    public ResponseEntity<RecommendationResponse> getMostFrequentlyBought(
            @Parameter(description = "Maximum number of products to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getMostFrequentlyBought(limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("most-frequently-bought")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/what-others-are-buying")
    @Operation(
        summary = "Get what others are buying",
        description = "Returns products that have been purchased recently and frequently (last 30 days). Shows current buying trends. Public endpoint."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Recent popular products retrieved successfully")
    })
    public ResponseEntity<RecommendationResponse> getWhatOthersAreBuying(
            @Parameter(description = "Maximum number of products to return", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Product> products = recommendationService.getWhatOthersAreBuying(limit);
        
        RecommendationResponse response = RecommendationResponse.builder()
                .products(products)
                .engine(recommendationService.getActiveEngineName())
                .strategy("what-others-are-buying")
                .count(products.size())
                .build();
        
        return ResponseEntity.ok(response);
    }
}

package com.giftastic.giftastic.modules.product.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.dto.ProductSearchRequest;
import com.giftastic.giftastic.modules.product.dto.ProductSearchResponse;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.category.domain.Category;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSearchServiceImpl implements ProductSearchService {

    private final ProductRepository productRepository;
    private final EntityManager entityManager;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;
    
    // Simple in-memory cache with TTL
    private final ConcurrentHashMap<String, CachedResult> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    @Override
    public Page<ProductSearchResponse> search(ProductSearchRequest request) {
        String cacheKey = generateCacheKey(request);
        
        // Check cache first
        CachedResult cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            log.debug("Cache hit for search: {}", cacheKey);
            return cached.result;
        }
        
        log.debug("Cache miss for search: {}, querying database", cacheKey);
        
        // Query database
        Page<ProductSearchResponse> result = performSearch(request);
        
        // Cache result
        cache.put(cacheKey, new CachedResult(result, System.currentTimeMillis() + CACHE_TTL_MS));
        
        // Clean expired cache entries periodically
        cleanExpiredCache();
        
        return result;
    }
    
    private Page<ProductSearchResponse> performSearch(ProductSearchRequest request) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Product> query = cb.createQuery(Product.class);
        Root<Product> product = query.from(Product.class);
        
        List<Predicate> predicates = buildPredicates(request, cb, query, product);
        
        query.where(predicates.toArray(new Predicate[0]));
        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            query.distinct(true);
        }
        
        // Apply sorting
        String sortBy = request.sortBy() != null ? request.sortBy().toLowerCase() : "newest";
        switch (sortBy) {
            case "price_asc":
                query.orderBy(cb.asc(product.get("price")));
                break;
            case "price_desc":
                query.orderBy(cb.desc(product.get("price")));
                break;
            case "rating":
                query.orderBy(cb.desc(product.get("averageRating")));
                break;
            case "popular":
                query.orderBy(cb.desc(product.get("reviewCount")));
                break;
            case "newest":
            default:
                query.orderBy(cb.desc(product.get("createdAt")));
                break;
        }
        
        // Execute query with pagination
        List<Product> products = entityManager.createQuery(query)
            .setFirstResult(request.page() * request.size())
            .setMaxResults(request.size())
            .getResultList();
        
        // Count total
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Product> countRoot = countQuery.from(Product.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(request, cb, countQuery, countRoot).toArray(new Predicate[0]));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        
        // Convert to response DTOs
        products.forEach(resultProduct -> resultProduct.applyCommissionRate(commissionPricingService.getApplicableRate(
                resultProduct.getSupplierId(), LocalDateTime.now())));
        List<ProductSearchResponse> responses = products.stream()
            .map(ProductSearchResponse::from)
            .collect(Collectors.toList());
        
        Pageable pageable = PageRequest.of(request.page(), request.size());
        return new PageImpl<>(responses, pageable, total);
    }

    private List<Predicate> buildPredicates(ProductSearchRequest request, CriteriaBuilder cb,
                                            CriteriaQuery<?> query, Root<Product> product) {
        List<Predicate> predicates = new ArrayList<>();

        predicates.add(cb.equal(product.get("status"), ProductStatus.APPROVED));
        predicates.add(hasVerifiedVendor(cb, query, product));

        if (request.query() != null && !request.query().isBlank()) {
            String searchTerm = "%" + request.query().toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(product.get("name")), searchTerm);
            Predicate descPredicate = cb.like(cb.lower(product.get("description")), searchTerm);
            predicates.add(cb.or(namePredicate, descPredicate));
        }

        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            List<UUID> categoryIds = request.categoryIds().stream()
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            if (!categoryIds.isEmpty()) {
                Join<Product, Category> category = product.join("categories");
                predicates.add(cb.or(
                        category.get("id").in(categoryIds),
                        category.get("categoryId").in(categoryIds)
                ));
            }
        }

        if (request.minPrice() != null) {
            predicates.add(cb.greaterThanOrEqualTo(product.get("price"), request.minPrice()));
        }
        if (request.maxPrice() != null) {
            predicates.add(cb.lessThanOrEqualTo(product.get("price"), request.maxPrice()));
        }

        if (Boolean.TRUE.equals(request.inStockOnly())) {
            predicates.add(cb.greaterThan(product.get("stockQuantity"), 0));
        }

        if (Boolean.TRUE.equals(request.onSaleOnly())) {
            predicates.add(cb.greaterThan(product.get("discountPercentage"), BigDecimal.ZERO));
            predicates.add(cb.or(
                cb.isNull(product.get("discountStartDate")),
                cb.lessThanOrEqualTo(product.get("discountStartDate"), LocalDateTime.now())
            ));
            predicates.add(cb.or(
                cb.isNull(product.get("discountEndDate")),
                cb.greaterThan(product.get("discountEndDate"), LocalDateTime.now())
            ));
        }

        return predicates;
    }

    private Predicate hasVerifiedVendor(CriteriaBuilder cb, CriteriaQuery<?> query, Root<Product> product) {
        Subquery<UUID> vendor = query.subquery(UUID.class);
        Root<com.giftastic.giftastic.modules.vendor.domain.Vendor> vendorRoot =
                vendor.from(com.giftastic.giftastic.modules.vendor.domain.Vendor.class);
        vendor.select(vendorRoot.get("supplierId"));
        vendor.where(
                cb.equal(vendorRoot.get("supplierId"), product.get("supplierId")),
                cb.isTrue(vendorRoot.get("isVerified"))
        );
        return cb.exists(vendor);
    }
    
    private String generateCacheKey(ProductSearchRequest request) {
        return String.format("search:%s:%s:%s:%s:%s:%s:%s:%d:%d",
            request.query(),
            request.categoryIds(),
            request.minPrice(),
            request.maxPrice(),
            request.inStockOnly(),
            request.onSaleOnly(),
            request.sortBy(),
            request.page(),
            request.size()
        );
    }
    
    private void cleanExpiredCache() {
        if (cache.size() > 100) { // Only clean if cache is getting large
            cache.entrySet().removeIf(entry -> entry.getValue().isExpired());
        }
    }
    
    @Override
    public void invalidateCache() {
        cache.clear();
        log.info("Product search cache cleared");
    }
    
    @Override
    public void invalidateCacheForProduct(UUID productId) {
        // For simplicity, clear entire cache when a product changes
        // In production, you'd want more granular invalidation
        cache.clear();
        log.debug("Cache invalidated for product: {}", productId);
    }
    
    private static class CachedResult {
        final Page<ProductSearchResponse> result;
        final long expiresAt;
        
        CachedResult(Page<ProductSearchResponse> result, long expiresAt) {
            this.result = result;
            this.expiresAt = expiresAt;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}

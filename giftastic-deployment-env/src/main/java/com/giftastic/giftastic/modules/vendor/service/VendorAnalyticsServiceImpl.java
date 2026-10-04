package com.giftastic.giftastic.modules.vendor.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;
import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;
import com.giftastic.giftastic.modules.review.repository.ReviewRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.dto.VendorAnalyticsResponse;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorAnalyticsServiceImpl implements VendorAnalyticsService {

    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    @Override
    public VendorAnalyticsResponse getAnalytics(UUID supplierId) {
        // Default to all-time analytics
        return getAnalytics(supplierId, null, null);
    }

    @Override
    public VendorAnalyticsResponse getAnalytics(UUID supplierId, LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Generating analytics for vendor: {}", supplierId);
        
        Vendor vendor = vendorRepository.findBySupplierId(supplierId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        
        // Get vendor's products
        List<Product> products = productRepository.findBySupplierId(supplierId);
        List<UUID> productIds = products.stream().map(Product::getId).collect(Collectors.toList());
        
        // Get orders containing vendor's products
        List<Order> allOrders = orderRepository.findAll();
        List<Order> vendorOrders = filterVendorOrders(allOrders, supplierId, startDate, endDate);
        
        // Calculate metrics
        VendorAnalyticsResponse.OverviewMetrics overview = calculateOverviewMetrics(products, vendorOrders, productIds);
        List<VendorAnalyticsResponse.ProductPerformance> topProducts = calculateTopProducts(products, vendorOrders);
        List<VendorAnalyticsResponse.RevenueByPeriod> revenueHistory = calculateRevenueHistory(vendorOrders, supplierId);
        List<VendorAnalyticsResponse.OrderStatusBreakdown> orderBreakdown = calculateOrderBreakdown(vendorOrders, supplierId);
        
        return VendorAnalyticsResponse.builder()
            .supplierId(supplierId)
            .storeName(vendor.getStoreName())
            .overview(overview)
            .topProducts(topProducts)
            .revenueHistory(revenueHistory)
            .orderBreakdown(orderBreakdown)
            .build();
    }

    private List<Order> filterVendorOrders(List<Order> allOrders, UUID supplierId, LocalDateTime startDate, LocalDateTime endDate) {
        return allOrders.stream()
            .filter(order -> {
                boolean hasVendorProduct = order.getItems().stream()
                    .anyMatch(item -> supplierId.equals(item.getSupplierId()));
                
                if (!hasVendorProduct || order.isVendorPortionInvalid(supplierId)
                        || order.getStatus() == OrderStatus.CANCELLED
                        || order.getStatus() == OrderStatus.INVALID) {
                    return false;
                }
                
                // Apply date filters if provided
                if (startDate != null && order.getPlacedAt().isBefore(startDate)) {
                    return false;
                }
                if (endDate != null && order.getPlacedAt().isAfter(endDate)) {
                    return false;
                }
                
                return true;
            })
            .collect(Collectors.toList());
    }

    private VendorAnalyticsResponse.OverviewMetrics calculateOverviewMetrics(
            List<Product> products, 
            List<Order> orders, 
            List<UUID> productIds) {
        
        int totalProducts = products.size();
        int approvedProducts = (int) products.stream()
            .filter(p -> p.getStatus() == ProductStatus.APPROVED)
            .count();
        int pendingProducts = (int) products.stream()
            .filter(p -> p.getStatus() == ProductStatus.PENDING_APPROVAL)
            .count();
        
        int totalOrders = orders.size();
        
        // Calculate revenue from vendor's products only
        BigDecimal totalRevenue = BigDecimal.ZERO;
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                if (productIds.contains(item.getProductId())) {
                    totalRevenue = totalRevenue.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }
        }
        
        BigDecimal averageOrderValue = totalOrders > 0 
            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Get reviews for vendor's products
        List<Review> productReviews = reviewRepository.findAll().stream()
            .filter(r -> r.getReviewType() == ReviewType.PRODUCT)
            .filter(r -> r.getEntityId() != null && productIds.contains(r.getEntityId()))
            .filter(r -> r.getStatus() == ReviewStatus.APPROVED)
            .collect(Collectors.toList());
        
        int totalReviews = productReviews.size();
        double averageRating = totalReviews > 0
            ? productReviews.stream()
                .map(Review::getRating)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0)
            : 0.0;
        
        return VendorAnalyticsResponse.OverviewMetrics.builder()
            .totalProducts(totalProducts)
            .approvedProducts(approvedProducts)
            .pendingProducts(pendingProducts)
            .totalOrders(totalOrders)
            .totalRevenue(totalRevenue)
            .averageOrderValue(averageOrderValue)
            .totalReviews(totalReviews)
            .averageRating(Math.round(averageRating * 10.0) / 10.0)
            .build();
    }

    private List<VendorAnalyticsResponse.ProductPerformance> calculateTopProducts(
            List<Product> products, 
            List<Order> orders) {
        
        Map<UUID, ProductStats> statsMap = new HashMap<>();
        
        // Initialize stats for all products
        for (Product product : products) {
            statsMap.put(product.getId(), new ProductStats(product.getName()));
        }
        
        // Aggregate order data
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                UUID productId = item.getProductId();
                if (statsMap.containsKey(productId)) {
                    ProductStats stats = statsMap.get(productId);
                    stats.orderCount++;
                    stats.quantitySold += item.getQuantity();
                    stats.revenue = stats.revenue.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }
        }
        
        // Add review data
        List<Review> reviews = reviewRepository.findAll().stream()
            .filter(r -> r.getReviewType() == ReviewType.PRODUCT)
            .filter(r -> r.getStatus() == ReviewStatus.APPROVED)
            .collect(Collectors.toList());
        
        for (Review review : reviews) {
            if (review.getEntityId() != null && statsMap.containsKey(review.getEntityId())) {
                ProductStats stats = statsMap.get(review.getEntityId());
                stats.reviewCount++;
                stats.totalRating = stats.totalRating.add(review.getRating());
            }
        }
        
        // Convert to response objects and sort by revenue
        return statsMap.entrySet().stream()
            .map(entry -> {
                UUID productId = entry.getKey();
                ProductStats stats = entry.getValue();
                double avgRating = stats.reviewCount > 0 
                    ? stats.totalRating.divide(BigDecimal.valueOf(stats.reviewCount), 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
                
                return VendorAnalyticsResponse.ProductPerformance.builder()
                    .productId(productId)
                    .productName(stats.productName)
                    .orderCount(stats.orderCount)
                    .quantitySold(stats.quantitySold)
                    .revenue(stats.revenue)
                    .averageRating(Math.round(avgRating * 10.0) / 10.0)
                    .reviewCount(stats.reviewCount)
                    .build();
            })
            .sorted(Comparator.comparing(VendorAnalyticsResponse.ProductPerformance::revenue).reversed())
            .limit(10)
            .collect(Collectors.toList());
    }

    private List<VendorAnalyticsResponse.RevenueByPeriod> calculateRevenueHistory(List<Order> orders, UUID supplierId) {
        Map<String, PeriodStats> periodMap = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        
        for (Order order : orders) {
            String period = order.getPlacedAt().format(formatter);
            PeriodStats stats = periodMap.computeIfAbsent(period, k -> new PeriodStats());
            
            BigDecimal orderRevenue = order.getItems().stream()
                .filter(item -> supplierId.equals(item.getSupplierId()))
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            stats.revenue = stats.revenue.add(orderRevenue);
            stats.orderCount++;
        }
        
        return periodMap.entrySet().stream()
            .map(entry -> VendorAnalyticsResponse.RevenueByPeriod.builder()
                .period(entry.getKey())
                .revenue(entry.getValue().revenue)
                .orderCount(entry.getValue().orderCount)
                .build())
            .sorted(Comparator.comparing(VendorAnalyticsResponse.RevenueByPeriod::period))
            .collect(Collectors.toList());
    }

    private List<VendorAnalyticsResponse.OrderStatusBreakdown> calculateOrderBreakdown(
            List<Order> orders, 
            UUID supplierId) {
        
        Map<String, StatusStats> statusMap = new HashMap<>();
        
        for (Order order : orders) {
            VendorOrderStatus vendorStatus = order.getVendorStatuses().get(supplierId);
            String status = vendorStatus != null ? vendorStatus.name() : order.getStatus().name();
            StatusStats stats = statusMap.computeIfAbsent(status, k -> new StatusStats());
            
            BigDecimal orderValue = BigDecimal.ZERO;
            for (OrderItem item : order.getItems()) {
                if (supplierId.equals(item.getSupplierId())) {
                    orderValue = orderValue.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }
            
            stats.count++;
            stats.totalValue = stats.totalValue.add(orderValue);
        }
        
        return statusMap.entrySet().stream()
            .map(entry -> VendorAnalyticsResponse.OrderStatusBreakdown.builder()
                .status(entry.getKey())
                .count(entry.getValue().count)
                .totalValue(entry.getValue().totalValue)
                .build())
            .sorted(Comparator.comparing(VendorAnalyticsResponse.OrderStatusBreakdown::count).reversed())
            .collect(Collectors.toList());
    }

    // Helper classes for aggregation
    private static class ProductStats {
        String productName;
        int orderCount = 0;
        int quantitySold = 0;
        BigDecimal revenue = BigDecimal.ZERO;
        int reviewCount = 0;
        BigDecimal totalRating = BigDecimal.ZERO;
        
        ProductStats(String productName) {
            this.productName = productName;
        }
    }
    
    private static class PeriodStats {
        BigDecimal revenue = BigDecimal.ZERO;
        int orderCount = 0;
    }
    
    private static class StatusStats {
        int count = 0;
        BigDecimal totalValue = BigDecimal.ZERO;
    }
}

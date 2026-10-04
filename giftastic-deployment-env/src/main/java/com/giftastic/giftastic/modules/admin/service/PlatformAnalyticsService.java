package com.giftastic.giftastic.modules.admin.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.admin.dto.PlatformAnalyticsDTO;
import com.giftastic.giftastic.modules.admin.dto.PlatformAnalyticsDTO.TopCustomer;
import com.giftastic.giftastic.modules.admin.dto.PlatformAnalyticsDTO.TopProduct;
import com.giftastic.giftastic.modules.admin.dto.PlatformAnalyticsDTO.TopVendor;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlatformAnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    public PlatformAnalyticsDTO getPlatformAnalytics() {
        List<Order> allOrders = orderRepository.findAll();
        
        List<TopProduct> topProducts = calculateTopProducts(allOrders);
        List<TopCustomer> topCustomers = calculateTopCustomers(allOrders);
        List<TopVendor> topVendors = calculateTopVendors(allOrders);
        
        return new PlatformAnalyticsDTO(topProducts, topCustomers, topVendors);
    }

    private List<TopProduct> calculateTopProducts(List<Order> orders) {
        Map<UUID, ProductStats> productStatsMap = new HashMap<>();
        
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                if (item.getSupplierId() != null && order.isVendorPortionInvalid(item.getSupplierId())) {
                    continue;
                }
                UUID productId = item.getProductId();
                ProductStats stats = productStatsMap.computeIfAbsent(productId, k -> new ProductStats());
                
                stats.totalSales += item.getQuantity();
                BigDecimal itemRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                stats.totalRevenue = stats.totalRevenue.add(itemRevenue);
            }
        }
        
        return productStatsMap.entrySet().stream()
                .sorted(Map.Entry.<UUID, ProductStats>comparingByValue(
                    Comparator.comparing((ProductStats s) -> s.totalRevenue).reversed()
                ))
                .limit(10)
                .map(entry -> {
                    UUID productId = entry.getKey();
                    ProductStats stats = entry.getValue();
                    
                    Product product = productRepository.findById(productId).orElse(null);
                    String productName = product != null ? product.getName() : "Unknown Product";
                    String vendorStoreName = "Unknown Vendor";
                    
                    if (product != null) {
                        vendorStoreName = vendorRepository.findBySupplierId(product.getSupplierId())
                                .map(Vendor::getStoreName)
                                .orElse("Unknown Vendor");
                    }
                    
                    return new TopProduct(
                        productId.toString(),
                        productName,
                        vendorStoreName,
                        stats.totalSales,
                        stats.totalRevenue
                    );
                })
                .collect(Collectors.toList());
    }

    private List<TopCustomer> calculateTopCustomers(List<Order> orders) {
        Map<UUID, CustomerStats> customerStatsMap = new HashMap<>();
        
        for (Order order : orders) {
            if (order.getCustomerId() != null) {
                UUID customerId = order.getCustomerId();
                CustomerStats stats = customerStatsMap.computeIfAbsent(customerId, k -> new CustomerStats());
                
                stats.totalOrders++;
                stats.totalSpent = stats.totalSpent.add(order.getValidVendorPortionsSubtotal());
            }
        }
        
        return customerStatsMap.entrySet().stream()
                .sorted(Map.Entry.<UUID, CustomerStats>comparingByValue(
                    Comparator.comparing((CustomerStats s) -> s.totalSpent).reversed()
                ))
                .limit(10)
                .map(entry -> {
                    UUID customerId = entry.getKey();
                    CustomerStats stats = entry.getValue();
                    
                    User user = userRepository.findById(customerId).orElse(null);
                    String customerName = user != null ? user.getFullName() : "Unknown User";
                    String customerEmail = user != null ? user.getEmail() : "";
                    
                    return new TopCustomer(
                        customerId.toString(),
                        customerName,
                        customerEmail,
                        stats.totalOrders,
                        stats.totalSpent
                    );
                })
                .collect(Collectors.toList());
    }

    private List<TopVendor> calculateTopVendors(List<Order> orders) {
        Map<UUID, VendorStats> vendorStatsMap = new HashMap<>();
        
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                if (item.getSupplierId() != null && order.isVendorPortionInvalid(item.getSupplierId())) {
                    continue;
                }
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null) {
                    UUID supplierId = product.getSupplierId();
                    VendorStats stats = vendorStatsMap.computeIfAbsent(supplierId, k -> new VendorStats());
                    
                    stats.totalOrders++;
                    BigDecimal itemRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    stats.totalRevenue = stats.totalRevenue.add(itemRevenue);
                }
            }
        }
        
        return vendorStatsMap.entrySet().stream()
                .sorted(Map.Entry.<UUID, VendorStats>comparingByValue(
                    Comparator.comparing((VendorStats s) -> s.totalRevenue).reversed()
                ))
                .limit(10)
                .map(entry -> {
                    UUID supplierId = entry.getKey();
                    VendorStats stats = entry.getValue();
                    
                    String storeName = vendorRepository.findBySupplierId(supplierId)
                            .map(Vendor::getStoreName)
                            .orElse("Unknown Vendor");
                    
                    BigDecimal avgOrderValue = stats.totalOrders > 0 
                        ? stats.totalRevenue.divide(BigDecimal.valueOf(stats.totalOrders), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                    
                    return new TopVendor(
                        supplierId.toString(),
                        storeName,
                        stats.totalOrders,
                        stats.totalRevenue,
                        avgOrderValue
                    );
                })
                .collect(Collectors.toList());
    }

    private static class ProductStats {
        long totalSales = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
    }

    private static class CustomerStats {
        long totalOrders = 0;
        BigDecimal totalSpent = BigDecimal.ZERO;
    }

    private static class VendorStats {
        long totalOrders = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
    }
}

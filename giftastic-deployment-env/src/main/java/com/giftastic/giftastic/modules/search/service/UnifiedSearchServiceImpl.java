package com.giftastic.giftastic.modules.search.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.modules.flow.domain.GiftFlow;
import com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository;
import com.giftastic.giftastic.modules.flow.service.GiftFlowService;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.search.dto.UnifiedSearchResponse;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedSearchServiceImpl implements UnifiedSearchService {

    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final GiftFlowRepository giftFlowRepository;
    private final GiftFlowService giftFlowService;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;

    @Override
    public UnifiedSearchResponse search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return new UnifiedSearchResponse(List.of(), List.of(), List.of(), 0);
        }

        log.debug("Unified search for: {}", query);

        // Search products
        List<Product> products = productRepository
            .findDiscoverableByStatusAndNameContainingIgnoreCase(
                ProductStatus.APPROVED, 
                query, 
                PageRequest.of(0, limit)
            )
            .getContent();

        products.forEach(product -> product.applyCommissionRate(commissionPricingService.getApplicableRate(
                product.getSupplierId(), java.time.LocalDateTime.now())));
        List<UnifiedSearchResponse.ProductSearchResult> productResults = products.stream()
            .map(p -> new UnifiedSearchResponse.ProductSearchResult(
                p.getId(),
                p.getName(),
                truncate(p.getDescription(), 100),
                p.getCustomerOriginalPrice(),
                p.getCustomerPrice(),
                p.hasActiveDiscount(),
                p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl()
            ))
            .collect(Collectors.toList());

        // Search vendors
        List<Vendor> vendors = vendorRepository
            .findByIsVerifiedTrueAndStoreNameContainingIgnoreCase(query, PageRequest.of(0, limit))
            .getContent();

        List<UnifiedSearchResponse.VendorSearchResult> vendorResults = vendors.stream()
            .map(v -> new UnifiedSearchResponse.VendorSearchResult(
                v.getSupplierId(),
                v.getStoreName(),
                truncate(v.getDescription(), 100),
                v.getLogoUrl()
            ))
            .collect(Collectors.toList());

        // Search gift flows
        List<GiftFlow> flows = giftFlowRepository
            .findDiscoverableByNameContainingIgnoreCase(query, PageRequest.of(0, limit))
            .getContent()
            .stream()
            .filter(giftFlowService::isFlowDiscoverable)
            .toList();

        List<UnifiedSearchResponse.GiftFlowSearchResult> flowResults = flows.stream()
            .map(f -> new UnifiedSearchResponse.GiftFlowSearchResult(
                f.getId(),
                f.getName(),
                truncate(f.getDescription(), 100),
                f.getImageUrl()
            ))
            .collect(Collectors.toList());

        int total = productResults.size() + vendorResults.size() + flowResults.size();

        return new UnifiedSearchResponse(productResults, vendorResults, flowResults, total);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}

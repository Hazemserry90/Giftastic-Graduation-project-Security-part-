package com.giftastic.giftastic.modules.flow.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giftastic.giftastic.common.config.OrderFlowConfig;
import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.common.storage.ObjectStorageService;
import com.giftastic.giftastic.modules.flow.domain.GiftFlow;
import com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GiftFlowServiceImpl implements GiftFlowService {

    private static final ObjectMapper FLOW_CONFIG_MAPPER = new ObjectMapper();

    private record ConfiguredProduct(UUID productId, int requiredMin) {}

    private final GiftFlowRepository giftFlowRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final ObjectStorageService objectStorageService;
    private final OrderFlowConfig orderFlowConfig;

    @Override
    public GiftFlow createFlow(UUID supplierId, String name, String description, String imageUrl, String configuration) {
        long existingFlows = giftFlowRepository.countBySupplierId(supplierId);
        int maxFlows = orderFlowConfig.getMaxGiftFlowsPerVendor();
        if (existingFlows >= maxFlows) {
            throw new IllegalArgumentException("Vendor cannot create more than " + maxFlows + " gift flows.");
        }

        GiftFlow flow = GiftFlow.create(
                supplierId, name, description, imageUrl, configuration, orderFlowConfig.getMaxGiftFlowSteps());
        return giftFlowRepository.save(flow);
    }

    @Override
    public GiftFlow updateFlow(UUID flowId, UUID supplierId, String name, String description, String imageUrl, String configuration) {
        GiftFlow flow = getOrThrow(flowId, supplierId);
        flow.update(name, description, imageUrl, configuration, orderFlowConfig.getMaxGiftFlowSteps());
        return giftFlowRepository.save(flow);
    }

    @Override
    public void deleteFlow(UUID flowId, UUID supplierId) {
        GiftFlow flow = getOrThrow(flowId, supplierId);
        objectStorageService.delete(flow.getImageObjectKey());
        giftFlowRepository.delete(flow);
    }

    @Override
    public GiftFlow getFlow(UUID flowId) {
        return giftFlowRepository.findById(flowId)
                .orElseThrow(() -> new RuntimeException("Gift Flow not found"));
    }

    @Override
    public GiftFlow getFlowForViewing(UUID flowId) {
        GiftFlow flow = getFlow(flowId);
        if (!isFlowDiscoverable(flow) && !canViewSupplierFlows(flow.getSupplierId())) {
            throw new ResourceNotFoundException("Gift Flow not found");
        }
        return flow;
    }

    @Override
    public List<GiftFlow> getFlowsBySupplier(UUID supplierId) {
        return giftFlowRepository.findBySupplierId(supplierId);
    }

    @Override
    public List<GiftFlow> getFlowsBySupplierForViewing(UUID supplierId) {
        if (canViewSupplierFlows(supplierId)) {
            return giftFlowRepository.findBySupplierId(supplierId);
        }
        if (isSupplierDiscoverable(supplierId)) {
            return giftFlowRepository.findDiscoverableBySupplierId(supplierId).stream()
                    .filter(this::hasCurrentSelectableProducts)
                    .toList();
        }
        return List.of();
    }

    @Override
    public List<GiftFlow> getAllFlows() {
        return getDiscoverableFlows();
    }

    @Override
    public List<GiftFlow> getDiscoverableFlows() {
        return giftFlowRepository.findDiscoverable().stream()
                .filter(this::hasCurrentSelectableProducts)
                .toList();
    }

    @Override
    public boolean isFlowDiscoverable(GiftFlow flow) {
        return flow != null
                && isSupplierDiscoverable(flow.getSupplierId())
                && hasCurrentSelectableProducts(flow);
    }

    private GiftFlow getOrThrow(UUID id, UUID supplierId) {
        return giftFlowRepository.findByIdAndSupplierId(id, supplierId)
                .orElseThrow(() -> new RuntimeException("Gift Flow not found or access denied"));
    }

    private boolean isSupplierDiscoverable(UUID supplierId) {
        return supplierId != null
                && vendorRepository.findBySupplierId(supplierId)
                .map(com.giftastic.giftastic.modules.vendor.domain.Vendor::isVerified)
                .orElse(false);
    }

    private boolean hasCurrentSelectableProducts(GiftFlow flow) {
        List<ConfiguredProduct> configuredProducts = extractConfiguredProducts(flow);
        if (configuredProducts.isEmpty()) {
            return false;
        }

        Map<UUID, Integer> requiredQuantityByProduct = configuredProducts.stream()
                .collect(Collectors.toMap(
                        ConfiguredProduct::productId,
                        ConfiguredProduct::requiredMin,
                        Integer::sum));

        for (UUID productId : configuredProducts.stream().map(ConfiguredProduct::productId).distinct().toList()) {
            Product product = productRepository.findById(productId).orElse(null);
            int requiredQuantity = requiredQuantityByProduct.getOrDefault(productId, 0);
            if (product == null
                    || product.getStatus() != ProductStatus.APPROVED
                    || !product.isInStock()
                    || product.getStockQuantity() < requiredQuantity
                    || !isSupplierDiscoverable(product.getSupplierId())) {
                return false;
            }
        }
        return true;
    }

    private List<ConfiguredProduct> extractConfiguredProducts(GiftFlow flow) {
        if (flow == null || flow.getConfiguration() == null || flow.getConfiguration().isBlank()) {
            return List.of();
        }
        try {
            JsonNode steps = FLOW_CONFIG_MAPPER.readTree(flow.getConfiguration()).path("steps");
            if (!steps.isArray()) {
                return List.of();
            }
            return StreamSupport.stream(steps.spliterator(), false)
                    .flatMap(step -> {
                        JsonNode products = step.path("products");
                        if (products.isArray()) {
                            return StreamSupport.stream(products.spliterator(), false)
                                    .map(this::toConfiguredProduct);
                        }
                        JsonNode productIds = step.path("productIds");
                        if (productIds.isArray()) {
                            return StreamSupport.stream(productIds.spliterator(), false)
                                    .map(JsonNode::asText)
                                    .map(this::toOptionalConfiguredProduct);
                        }
                        return java.util.stream.Stream.<ConfiguredProduct>empty();
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private ConfiguredProduct toConfiguredProduct(JsonNode productNode) {
        if (productNode == null) {
            return null;
        }
        String productId = productNode.isTextual() ? productNode.asText() : productNode.path("productId").asText(null);
        if (productId == null || productId.isBlank()) {
            return null;
        }
        boolean required = !productNode.isTextual() && productNode.path("required").asBoolean(false);
        int min = !productNode.isTextual() && productNode.has("min") ? Math.max(0, productNode.path("min").asInt(0)) : 0;
        return toOptionalConfiguredProduct(productId, required ? Math.max(1, min) : 0);
    }

    private ConfiguredProduct toOptionalConfiguredProduct(String productId) {
        return toOptionalConfiguredProduct(productId, 0);
    }

    private ConfiguredProduct toOptionalConfiguredProduct(String productId, int requiredMin) {
        try {
            return new ConfiguredProduct(UUID.fromString(productId), requiredMin);
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean canViewSupplierFlows(UUID supplierId) {
        UUID currentSupplierId = SecurityUtils.getCurrentSupplierId();
        return (supplierId != null && currentSupplierId != null && supplierId.equals(currentSupplierId))
                || SecurityUtils.hasAuthority("SUPER_ADMIN")
                || SecurityUtils.hasAuthority("MANAGE_GIFT_FLOWS");
    }
}

package com.giftastic.giftastic.modules.cart.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import com.giftastic.giftastic.modules.cart.domain.Cart;
import com.giftastic.giftastic.modules.cart.dto.CartItemBulkRequest;
import com.giftastic.giftastic.modules.cart.dto.CartResponse;
import com.giftastic.giftastic.modules.cart.repository.CartRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository giftFlowRepository;
    private final com.giftastic.giftastic.modules.vendor.repository.VendorRepository vendorRepository;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;

    @Override
    @Transactional
    public CartResponse getCart(UUID customerId) {
        Cart cart = getOrCreateCartInternal(customerId);
        if (cart.consolidateDuplicateItems()) {
            cartRepository.save(cart);
        }
        return mapToResponse(cart);
    }

    private Cart getOrCreateCartInternal(UUID customerId) {
        return cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> createCart(customerId, false));
    }

    private Cart getOrCreateCartForUpdate(UUID customerId) {
        return cartRepository.findByCustomerIdForUpdate(customerId)
                .orElseGet(() -> createCart(customerId, true));
    }

    private Cart createCart(UUID customerId, boolean lockForUpdate) {
        try {
            return cartRepository.saveAndFlush(new Cart(UUID.randomUUID(), customerId, new ArrayList<>(), LocalDateTime.now()));
        } catch (DataIntegrityViolationException ex) {
            return (lockForUpdate ? cartRepository.findByCustomerIdForUpdate(customerId) : cartRepository.findByCustomerId(customerId))
                    .orElseThrow(() -> ex);
        }
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartResponse.CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> {
                    Product product = productRepository.findById(item.getProductId())
                            .orElse(null);
                    
                    String storeName = "Unknown Store";
                    if (product != null && product.getSupplierId() != null) {
                        storeName = vendorRepository.findBySupplierId(product.getSupplierId())
                                .map(v -> v.getStoreName() != null && !v.getStoreName().isBlank() 
                                    ? v.getStoreName() 
                                    : "Store #" + v.getSupplierId().toString().substring(0, 8))
                                .orElse("Unknown Store");
                    }
                    
                    return CartResponse.CartItemResponse.builder()
                            .productId(item.getProductId())
                            .productName(product != null ? product.getName() : "Unknown Product")
                            .price(product != null && product.getPrice() != null
                                    ? commissionPricingService.quote(product.getSupplierId(), product.getDiscountedPrice(),
                                            product.getEffectivePricingMode(), LocalDateTime.now()).customerPrice().doubleValue()
                                    : 0.0)
                            .imageUrl(product != null && !product.getImages().isEmpty() 
                                    ? product.getImages().get(0).getUrl() : null)
                            .quantity(item.getQuantity())
                            .groupId(item.getGroupId())
                            .metadata(item.getMetadata())
                            .supplierId(product != null ? product.getSupplierId() : null)
                            .storeName(storeName)
                            .build();
                })
                .toList();

        double total = itemResponses.stream()
                .mapToDouble(it -> it.getPrice() * it.getQuantity())
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .customerId(cart.getCustomerId())
                .items(itemResponses)
                .total(total)
                .build();
    }

    @Override
    @Transactional
    public void addItem(UUID customerId, UUID productId, int quantity, String groupId, String metadata) {
        Cart cart = getOrCreateCartForUpdate(customerId);
        validateProductStock(cart, List.of(new CartQuantityRequest(productId, groupId, quantity)));
        cart.addOrUpdateItem(productId, quantity, groupId, metadata);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public void addItems(UUID customerId, List<CartItemBulkRequest> items) {
        validateGiftFlowItems(items);
        Cart cart = getOrCreateCartForUpdate(customerId);
        validateProductStock(cart, items.stream()
                .map(item -> new CartQuantityRequest(item.getProductId(), item.getGroupId(), item.getQuantity()))
                .toList());
        for (CartItemBulkRequest item : items) {
            cart.addOrUpdateItem(item.getProductId(), item.getQuantity(), item.getGroupId(), item.getMetadata());
        }
        cartRepository.save(cart);
    }

    private void validateGiftFlowItems(List<CartItemBulkRequest> items) {
        if (items == null || items.isEmpty()) return;

        // Group items by groupId
        java.util.Map<String, List<CartItemBulkRequest>> groups = items.stream()
            .filter(item -> item.getGroupId() != null && !item.getGroupId().isBlank())
            .collect(java.util.stream.Collectors.groupingBy(CartItemBulkRequest::getGroupId));

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        for (java.util.Map.Entry<String, List<CartItemBulkRequest>> entry : groups.entrySet()) {
            List<CartItemBulkRequest> groupItems = entry.getValue();
            
            // Find flowId from metadata
            UUID flowId = null;
            for (CartItemBulkRequest item : groupItems) {
                if (item.getMetadata() != null && !item.getMetadata().isBlank()) {
                    try {
                        com.fasterxml.jackson.databind.JsonNode meta = mapper.readTree(item.getMetadata());
                        if (meta.has("flowId")) {
                            flowId = UUID.fromString(meta.get("flowId").asText());
                            break;
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }

            if (flowId != null) {
                com.giftastic.giftastic.modules.flow.domain.GiftFlow flow = giftFlowRepository.findById(flowId)
                    .orElseThrow(() -> new IllegalArgumentException("Gift flow not found."));

                try {
                    com.fasterxml.jackson.databind.JsonNode config = mapper.readTree(flow.getConfiguration());
                    com.fasterxml.jackson.databind.JsonNode steps = config.get("steps");
                    if (steps != null && steps.isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode stepNode : steps) {
                            String stepId = stepNode.get("id").asText();
                            String stepTitle = stepNode.has("title") ? stepNode.get("title").asText() : "Step";
                            boolean stepRequired = stepNode.has("required") && stepNode.get("required").asBoolean();
                            String stepType = stepNode.has("type") ? stepNode.get("type").asText() : "single";

                            if ("note".equalsIgnoreCase(stepType)) {
                                continue;
                            }

                            com.fasterxml.jackson.databind.JsonNode productsNode = stepNode.get("products");
                            
                            // Map products in this step to their actual configurations
                            java.util.Map<UUID, com.fasterxml.jackson.databind.JsonNode> productConfigs = new java.util.HashMap<>();
                            if (productsNode != null && productsNode.isArray()) {
                                for (com.fasterxml.jackson.databind.JsonNode prodNode : productsNode) {
                                    UUID pid = UUID.fromString(prodNode.get("productId").asText());
                                    productConfigs.put(pid, prodNode);
                                }
                            }

                            // Calculate quantities selected for each product in this step
                            int stepTotalQty = 0;
                            java.util.Map<UUID, Integer> selectedQtys = new java.util.HashMap<>();
                            
                            for (CartItemBulkRequest item : groupItems) {
                                if (item.getMetadata() != null && !item.getMetadata().isBlank()) {
                                    try {
                                        com.fasterxml.jackson.databind.JsonNode meta = mapper.readTree(item.getMetadata());
                                        if (meta.has("flowStepId") && stepId.equals(meta.get("flowStepId").asText())) {
                                            selectedQtys.put(item.getProductId(), selectedQtys.getOrDefault(item.getProductId(), 0) + item.getQuantity());
                                            stepTotalQty += item.getQuantity();
                                        }
                                    } catch (Exception e) {
                                        // ignore
                                    }
                                }
                            }

                            // Validate step requirements
                            if (stepRequired && stepTotalQty < 1) {
                                throw new IllegalArgumentException("Step '" + stepTitle + "' is required. Please select at least 1 product.");
                            }

                            // Validate per-product requirements
                            for (java.util.Map.Entry<UUID, com.fasterxml.jackson.databind.JsonNode> pEntry : productConfigs.entrySet()) {
                                UUID pid = pEntry.getKey();
                                com.fasterxml.jackson.databind.JsonNode pConf = pEntry.getValue();

                                boolean pRequired = pConf.has("required") && pConf.get("required").asBoolean();
                                int pMin = pConf.has("min") ? pConf.get("min").asInt() : 0;
                                int pMax = pConf.has("max") ? pConf.get("max").asInt() : 1;

                                int selectedQty = selectedQtys.getOrDefault(pid, 0);

                                if (pRequired && selectedQty < Math.max(1, pMin)) {
                                    throw new IllegalArgumentException("Product is required in step '" + stepTitle + "'. Minimum quantity: " + Math.max(1, pMin));
                                }

                                if (selectedQty > 0) {
                                    if (selectedQty < pMin) {
                                        throw new IllegalArgumentException("Product in step '" + stepTitle + "' must be selected with at least " + pMin + " units.");
                                    }
                                    if (selectedQty > pMax) {
                                        throw new IllegalArgumentException("Product in step '" + stepTitle + "' cannot exceed " + pMax + " units.");
                                    }
                                }
                            }
                        }
                    }
                } catch (IllegalArgumentException ex) {
                    throw ex;
                } catch (Exception e) {
                    throw new IllegalArgumentException("Failed to validate gift flow selections: " + e.getMessage());
                }
            }
        }
    }

    @Override
    @Transactional
    public void updateQuantity(UUID customerId, UUID productId, String groupId, int quantity) {
        Cart cart = getOrCreateCartForUpdate(customerId);
        if (quantity > 0) {
            validateProductStock(cart, List.of(new CartQuantityRequest(productId, groupId, quantity)));
        }
        cart.updateItemQuantity(productId, groupId, quantity);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public void removeItem(UUID customerId, UUID productId, String groupId) {
        Cart cart = getOrCreateCartForUpdate(customerId);
        cart.removeItem(productId, groupId);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public void removeGroup(UUID customerId, String groupId) {
        Cart cart = getOrCreateCartForUpdate(customerId);
        cart.removeGroup(groupId);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public void clearCart(UUID customerId) {
        cartRepository.deleteByCustomerId(customerId);
    }

    private void validateProductStock(Cart cart, List<CartQuantityRequest> requests) {
        if (requests == null || requests.isEmpty()) return;

        Map<CartItemKey, Integer> requestedQuantities = new HashMap<>();
        for (CartQuantityRequest request : requests) {
            requestedQuantities.put(new CartItemKey(request.productId(), normalizeGroupId(request.groupId())), request.quantity());
        }

        Set<CartItemKey> requestedKeys = new HashSet<>(requestedQuantities.keySet());
        Map<UUID, Integer> finalProductQuantities = new HashMap<>();
        cart.getItems().stream()
                .filter(item -> !requestedKeys.contains(new CartItemKey(item.getProductId(), normalizeGroupId(item.getGroupId()))))
                .forEach(item -> finalProductQuantities.merge(item.getProductId(), item.getQuantity(), Integer::sum));

        requestedQuantities.forEach((key, quantity) -> {
            if (quantity > 0) {
                finalProductQuantities.merge(key.productId(), quantity, Integer::sum);
            }
        });

        for (Map.Entry<UUID, Integer> entry : finalProductQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            int requestedQuantity = entry.getValue();
            if (!product.hasStock(requestedQuantity)) {
                throw new IllegalArgumentException(stockErrorMessage(product, requestedQuantity));
            }
        }
    }

    private String stockErrorMessage(Product product, int requestedQuantity) {
        return "\"" + product.getName() + "\" only has " + product.getStockQuantity()
                + " available, but you requested " + requestedQuantity + ". Please adjust the quantity.";
    }

    private String normalizeGroupId(String groupId) {
        return groupId == null || groupId.isBlank() ? null : groupId;
    }

    private record CartQuantityRequest(UUID productId, String groupId, int quantity) {}

    private record CartItemKey(UUID productId, String groupId) {
        private CartItemKey {
            groupId = Objects.requireNonNullElse(groupId, "");
        }
    }
}

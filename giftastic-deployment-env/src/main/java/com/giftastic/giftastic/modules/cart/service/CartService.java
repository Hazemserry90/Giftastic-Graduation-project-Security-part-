package com.giftastic.giftastic.modules.cart.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.cart.dto.CartItemBulkRequest;
import com.giftastic.giftastic.modules.cart.dto.CartResponse;

public interface CartService {
    CartResponse getCart(UUID customerId);
    void addItem(UUID customerId, UUID productId, int quantity, String groupId, String metadata);
    void addItems(UUID customerId, List<CartItemBulkRequest> items);
    void updateQuantity(UUID customerId, UUID productId, String groupId, int quantity);
    void removeItem(UUID customerId, UUID productId, String groupId);
    void removeGroup(UUID customerId, String groupId);
    void clearCart(UUID customerId);
}

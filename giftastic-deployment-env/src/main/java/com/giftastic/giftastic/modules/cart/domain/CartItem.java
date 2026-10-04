package com.giftastic.giftastic.modules.cart.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class CartItem {

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "group_id")
    private String groupId;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    public CartItem(UUID productId, int quantity){
        validateQuantity(quantity);
        this.productId = productId;
        this.quantity = quantity;
    }

    public CartItem(UUID productId, int quantity, String groupId, String metadata) {
        validateQuantity(quantity);
        this.productId = productId;
        this.quantity = quantity;
        this.groupId = groupId;
        this.metadata = metadata;
    }

    public void updateQuantity(int newQuantity) {
        validateQuantity(newQuantity);
        this.quantity = newQuantity;
    }

    public void updateMetadata(String metadata) {
        this.metadata = metadata;
    }

    public void increaseQuantity(int additionalQuantity) {
        if (additionalQuantity <= 0)
            throw new IllegalArgumentException("Increment must be positive");
        this.quantity += additionalQuantity;
    }

    private void validateQuantity(int quantity) {
        if (quantity <= 0)
            throw new IllegalArgumentException("Quantity must be at least 1");
        if (quantity > 99)
            throw new IllegalArgumentException("Maximum 99 units allowed per item");
    }
}

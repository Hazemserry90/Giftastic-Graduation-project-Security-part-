package com.giftastic.giftastic.modules.cart.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "carts")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // Required by JPA
public class Cart {

    @Id
    private UUID id; // Removed final

    @Column(nullable = false, unique = true)
    private UUID customerId; // Removed final

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "cart_items",
            joinColumns = @JoinColumn(name = "cart_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_cart_items_cart_product_group",
                    columnNames = {"cart_id", "product_id", "group_id"}))
    private List<CartItem> items = new ArrayList<>(); // Removed final

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void addOrUpdateItem(UUID productId, int quantity, String groupId, String metadata) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        String normalizedGroupId = normalizeGroupId(groupId);

        Optional<CartItem> existingItem = findItem(productId, normalizedGroupId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.updateQuantity(quantity);
            item.updateMetadata(metadata);
            removeDuplicateItems(productId, normalizedGroupId, item);
        } else {
            items.add(new CartItem(productId, quantity, normalizedGroupId, metadata));
        }
        touch();
    }

    public void updateItemQuantity(UUID productId, String groupId, int newQuantity) {
        String normalizedGroupId = normalizeGroupId(groupId);
        if (newQuantity <= 0) {
            removeItem(productId, normalizedGroupId);
        } else {
            findItem(productId, normalizedGroupId).ifPresentOrElse(
                    item -> {
                        item.updateQuantity(newQuantity);
                        removeDuplicateItems(productId, normalizedGroupId, item);
                    },
                    () -> { throw new IllegalArgumentException("Item not in cart"); }
            );
        }
        touch();
    }

    public void removeItem(UUID productId, String groupId) {
        String normalizedGroupId = normalizeGroupId(groupId);
        items.removeIf(item -> item.getProductId().equals(productId)
                && java.util.Objects.equals(normalizeGroupId(item.getGroupId()), normalizedGroupId));
        touch();
    }

    public void removeGroup(String groupId) {
        String normalizedGroupId = normalizeGroupId(groupId);
        if (normalizedGroupId != null) {
            items.removeIf(item -> java.util.Objects.equals(normalizeGroupId(item.getGroupId()), normalizedGroupId));
            touch();
        }
    }

    public boolean consolidateDuplicateItems() {
        boolean changed = false;
        List<CartItem> uniqueItems = new ArrayList<>();

        for (CartItem item : items) {
            String normalizedGroupId = normalizeGroupId(item.getGroupId());
            boolean duplicate = uniqueItems.stream()
                    .anyMatch(existing -> existing.getProductId().equals(item.getProductId())
                            && java.util.Objects.equals(normalizeGroupId(existing.getGroupId()), normalizedGroupId));

            if (duplicate) {
                changed = true;
            } else {
                uniqueItems.add(item);
            }
        }

        if (changed) {
            items.clear();
            items.addAll(uniqueItems);
            touch();
        }

        return changed;
    }

    private Optional<CartItem> findItem(UUID productId, String groupId) {
        String normalizedGroupId = normalizeGroupId(groupId);
        return items.stream()
                .filter(item -> item.getProductId().equals(productId)
                        && java.util.Objects.equals(normalizeGroupId(item.getGroupId()), normalizedGroupId))
                .findFirst();
    }

    private void removeDuplicateItems(UUID productId, String groupId, CartItem keepItem) {
        String normalizedGroupId = normalizeGroupId(groupId);
        items.removeIf(item -> item != keepItem
                && item.getProductId().equals(productId)
                && java.util.Objects.equals(normalizeGroupId(item.getGroupId()), normalizedGroupId));
    }

    private String normalizeGroupId(String groupId) {
        return groupId == null || groupId.isBlank() ? null : groupId;
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}

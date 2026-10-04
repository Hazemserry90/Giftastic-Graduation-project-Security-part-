package com.giftastic.giftastic.modules.cart.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class CartTests {

    @Test
    void addOrUpdateItemSetsExistingQuantityInsteadOfAddingAgain() {
        Cart cart = new Cart(UUID.randomUUID(), UUID.randomUUID(), new ArrayList<>(), LocalDateTime.now());
        UUID productId = UUID.randomUUID();

        cart.addOrUpdateItem(productId, 5, null, null);
        cart.addOrUpdateItem(productId, 5, null, null);

        assertThat(cart.getItems()).hasSize(1);
        assertThat(cart.getItems().get(0).getQuantity()).isEqualTo(5);
    }

    @Test
    void consolidateDuplicateItemsKeepsOneProductPerCartGroup() {
        Cart cart = new Cart(UUID.randomUUID(), UUID.randomUUID(), new ArrayList<>(), LocalDateTime.now());
        UUID productId = UUID.randomUUID();

        cart.getItems().add(new CartItem(productId, 5, null, null));
        cart.getItems().add(new CartItem(productId, 5, null, null));

        assertThat(cart.consolidateDuplicateItems()).isTrue();
        assertThat(cart.getItems()).hasSize(1);
        assertThat(cart.getItems().get(0).getQuantity()).isEqualTo(5);
    }
}

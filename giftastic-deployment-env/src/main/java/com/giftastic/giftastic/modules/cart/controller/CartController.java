package com.giftastic.giftastic.modules.cart.controller;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.cart.dto.CartResponse;
import com.giftastic.giftastic.modules.cart.service.CartService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Shopping Cart", description = "Shopping cart management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class CartController {

    private final CartService cartService;

    @GetMapping("/{customerId}")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<CartResponse> getCart(@PathVariable UUID customerId) {
        return ResponseEntity.ok(cartService.getCart(customerId));
    }

    @PostMapping("/{customerId}/items")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> addItem(
            @PathVariable UUID customerId,
            @RequestParam UUID productId,
            @RequestParam int quantity,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String metadata) {
        cartService.addItem(customerId, productId, quantity, groupId, metadata);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{customerId}/items/bulk")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> addItems(
            @PathVariable UUID customerId,
            @RequestBody List<com.giftastic.giftastic.modules.cart.dto.CartItemBulkRequest> items) {
        cartService.addItems(customerId, items);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{customerId}/items/{productId}")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> updateQuantity(
            @PathVariable UUID customerId,
            @PathVariable UUID productId,
            @RequestParam int quantity,
            @RequestParam(required = false) String groupId) {
        cartService.updateQuantity(customerId, productId, groupId, quantity);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{customerId}/items/{productId}")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> removeItem(
            @PathVariable UUID customerId,
            @PathVariable UUID productId,
            @RequestParam(required = false) String groupId) {
        cartService.removeItem(customerId, productId, groupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{customerId}/groups/{groupId}")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> removeGroup(
            @PathVariable UUID customerId,
            @PathVariable String groupId) {
        cartService.removeGroup(customerId, groupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{customerId}/clear")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> clearCart(@PathVariable UUID customerId) {
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }
}
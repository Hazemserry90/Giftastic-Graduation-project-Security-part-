package com.giftastic.giftastic.modules.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.user.domain.FavoriteProduct;
import com.giftastic.giftastic.modules.user.repository.FavoriteProductRepository;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "User favorites management")
@SecurityRequirement(name = "bearer-jwt")
public class FavoriteController {

    private final FavoriteProductRepository favoriteProductRepository;

    @GetMapping
    public ResponseEntity<List<FavoriteProduct>> getFavorites() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(favoriteProductRepository.findByUserId(userId));
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<FavoriteProduct> addProductFavorite(@PathVariable UUID productId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (favoriteProductRepository.existsByUserIdAndProductId(userId, productId)) {
            return ResponseEntity.ok(favoriteProductRepository.findByUserIdAndProductId(userId, productId).get());
        }
        FavoriteProduct favorite = FavoriteProduct.forProduct(userId, productId);
        return ResponseEntity.ok(favoriteProductRepository.save(favorite));
    }

    @DeleteMapping("/product/{productId}")
    @Transactional
    public ResponseEntity<Void> removeProductFavorite(@PathVariable UUID productId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        favoriteProductRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/flow/{flowId}")
    public ResponseEntity<FavoriteProduct> addFlowFavorite(@PathVariable UUID flowId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (favoriteProductRepository.existsByUserIdAndFlowId(userId, flowId)) {
            return ResponseEntity.ok(favoriteProductRepository.findByUserIdAndFlowId(userId, flowId).get());
        }
        FavoriteProduct favorite = FavoriteProduct.forFlow(userId, flowId);
        return ResponseEntity.ok(favoriteProductRepository.save(favorite));
    }

    @DeleteMapping("/flow/{flowId}")
    @Transactional
    public ResponseEntity<Void> removeFlowFavorite(@PathVariable UUID flowId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        favoriteProductRepository.deleteByUserIdAndFlowId(userId, flowId);
        return ResponseEntity.noContent().build();
    }

    // Compatibility endpoints (deprecated but kept for now)
    @PostMapping("/{productId}")
    public ResponseEntity<FavoriteProduct> addFavorite(@PathVariable UUID productId) {
        return addProductFavorite(productId);
    }

    @DeleteMapping("/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFavorite(@PathVariable UUID productId) {
        return removeProductFavorite(productId);
    }
}

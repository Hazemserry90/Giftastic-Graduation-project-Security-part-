package com.giftastic.giftastic.modules.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.user.domain.FavoriteProduct;

@Repository
public interface FavoriteProductRepository extends JpaRepository<FavoriteProduct, UUID> {
    List<FavoriteProduct> findByUserId(UUID userId);
    
    Optional<FavoriteProduct> findByUserIdAndProductId(UUID userId, UUID productId);
    void deleteByUserIdAndProductId(UUID userId, UUID productId);
    boolean existsByUserIdAndProductId(UUID userId, UUID productId);
    
    Optional<FavoriteProduct> findByUserIdAndFlowId(UUID userId, UUID flowId);
    void deleteByUserIdAndFlowId(UUID userId, UUID flowId);
    boolean existsByUserIdAndFlowId(UUID userId, UUID flowId);
}

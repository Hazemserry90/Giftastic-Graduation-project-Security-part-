package com.giftastic.giftastic.modules.user.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_favorites", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "product_id", "flow_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FavoriteProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "flow_id")
    private UUID flowId;

    @Column(nullable = false)
    private LocalDateTime addedAt;

    public FavoriteProduct(UUID userId, UUID productId, UUID flowId) {
        this.userId = userId;
        this.productId = productId;
        this.flowId = flowId;
        this.addedAt = LocalDateTime.now();
    }

    public static FavoriteProduct forProduct(UUID userId, UUID productId) {
        return new FavoriteProduct(userId, productId, null);
    }

    public static FavoriteProduct forFlow(UUID userId, UUID flowId) {
        return new FavoriteProduct(userId, null, flowId);
    }
}

package com.giftastic.giftastic.modules.cart.dto;

import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartResponse {
    private UUID id;
    private UUID customerId;
    private List<CartItemResponse> items;
    private double total;

    @Data
    @Builder
    public static class CartItemResponse {
        private UUID productId;
        private String productName;
        private String imageUrl;
        private double price;
        private int quantity;
        private String groupId;
        private String metadata;
        private UUID supplierId;
        private String storeName;
    }
}

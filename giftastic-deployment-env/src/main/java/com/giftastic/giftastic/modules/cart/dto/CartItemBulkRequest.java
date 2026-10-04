package com.giftastic.giftastic.modules.cart.dto;

import java.util.UUID;
import lombok.Data;

@Data
public class CartItemBulkRequest {
    private UUID productId;
    private int quantity;
    private String groupId;
    private String metadata;
}

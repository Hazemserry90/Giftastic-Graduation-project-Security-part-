package com.giftastic.giftastic.common.dto;

import java.util.UUID;

public record ProductSecurityDTO(UUID ownerId,
                                 boolean isPrivate) {
    
}

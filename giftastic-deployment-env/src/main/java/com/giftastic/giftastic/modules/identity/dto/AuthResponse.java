package com.giftastic.giftastic.modules.identity.dto;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
    String token, 
    String email, 
    UUID userId,
    UserInfo user
) {
    public record UserInfo(
        UUID id,
        String email,
        UUID supplierId,
        List<String> roles,
        String role
    ) {}
}
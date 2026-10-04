package com.giftastic.giftastic.modules.commission.dto;

public record InvalidateVendorPortionRequest(
        String reason,
        String details
) {}

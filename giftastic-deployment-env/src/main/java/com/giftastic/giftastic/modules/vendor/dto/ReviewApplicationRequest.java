package com.giftastic.giftastic.modules.vendor.dto;

public record ReviewApplicationRequest(
    boolean approved,
    String rejectionReason
) {}

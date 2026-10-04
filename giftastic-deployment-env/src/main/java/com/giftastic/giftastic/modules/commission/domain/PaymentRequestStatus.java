package com.giftastic.giftastic.modules.commission.domain;

public enum PaymentRequestStatus {
    PENDING,   // Awaiting admin review
    APPROVED,  // Admin verified payment
    REJECTED   // Admin rejected payment proof
}

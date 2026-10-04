package com.giftastic.giftastic.modules.commission.domain;

public enum CommissionStatus {
    PENDING,           // Awaiting payment from vendor
    PAYMENT_SUBMITTED, // Vendor submitted payment proof
    PAID,             // Admin verified payment
    OVERDUE           // Past 45-day due date
}

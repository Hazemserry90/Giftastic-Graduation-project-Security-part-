package com.giftastic.giftastic.modules.commission.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import com.giftastic.giftastic.common.pricing.CommissionRates;

@Entity
@Table(name = "commissions", indexes = {
    @Index(name = "idx_commission_order", columnList = "order_id"),
    @Index(name = "idx_commission_supplier", columnList = "supplier_id"),
    @Index(name = "idx_commission_status", columnList = "status"),
    @Index(name = "idx_commission_due_date", columnList = "due_date")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Commission {

    @Transient
    private BigDecimal payableAmount;

    @Id
    @NonNull
    private UUID id;

    @Column(nullable = false, name = "order_id")
    @NonNull
    private UUID orderId;

    @Column(nullable = false, name = "supplier_id")
    @NonNull
    private UUID supplierId;

    @Column(nullable = false, precision = 19, scale = 2, name = "order_subtotal")
    @NonNull
    private BigDecimal orderSubtotal;

    @Column(nullable = false, precision = 5, scale = 4, name = "commission_rate")
    @NonNull
    private BigDecimal commissionRate;

    @Column(nullable = false, precision = 19, scale = 2, name = "commission_amount")
    @NonNull
    private BigDecimal commissionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction")
    private CommissionDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private CommissionStatus status;

    @Column(nullable = false, name = "due_date")
    @NonNull
    private LocalDateTime dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(nullable = false, name = "created_at")
    @NonNull
    private LocalDateTime createdAt;

    private Commission(UUID id, UUID orderId, UUID supplierId, BigDecimal orderSubtotal,
                      BigDecimal commissionRate, BigDecimal commissionAmount, LocalDateTime dueDate,
                      CommissionDirection direction) {
        this.id = id;
        this.orderId = orderId;
        this.supplierId = supplierId;
        this.orderSubtotal = orderSubtotal;
        this.commissionRate = commissionRate;
        this.commissionAmount = commissionAmount;
        this.direction = direction;
        this.status = CommissionStatus.PENDING;
        this.dueDate = dueDate;
        this.createdAt = LocalDateTime.now();
    }

    public static Commission create(UUID orderId, UUID supplierId, BigDecimal orderSubtotal,
                                   BigDecimal commissionRate, LocalDateTime orderCompletedAt) {
        if (orderSubtotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Order subtotal cannot be negative");
        }
        BigDecimal normalizedRate = CommissionRates.requireFraction(commissionRate);

        BigDecimal commissionAmount = calculateCommissionAmount(orderSubtotal, normalizedRate);
        LocalDateTime dueDate = orderCompletedAt;

        return new Commission(UUID.randomUUID(), orderId, supplierId, orderSubtotal,
                            normalizedRate, commissionAmount, dueDate, CommissionDirection.VENDOR_TO_PLATFORM);
    }

    public static Commission createVendorPayout(UUID orderId, UUID supplierId, BigDecimal orderSubtotal,
                                                BigDecimal commissionRate, LocalDateTime confirmedAt) {
        Commission commission = create(orderId, supplierId, orderSubtotal, commissionRate, confirmedAt);
        commission.direction = CommissionDirection.PLATFORM_TO_VENDOR;
        return commission;
    }

    public CommissionDirection effectiveDirection() {
        return direction == null ? CommissionDirection.VENDOR_TO_PLATFORM : direction;
    }

    public BigDecimal getCommissionRate() {
        return CommissionRates.requireFraction(commissionRate);
    }

    public BigDecimal getCommissionAmount() {
        return calculateCommissionAmount(orderSubtotal, getCommissionRate());
    }

    public BigDecimal getPayableAmount() {
        BigDecimal calculatedCommissionAmount = getCommissionAmount();
        return effectiveDirection() == CommissionDirection.PLATFORM_TO_VENDOR
                ? orderSubtotal.subtract(calculatedCommissionAmount)
                : calculatedCommissionAmount;
    }

    private static BigDecimal calculateCommissionAmount(BigDecimal subtotal, BigDecimal rate) {
        return subtotal.multiply(rate).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public void markAsPaid() {
        if (this.status == CommissionStatus.PAID) {
            throw new IllegalStateException("Commission already marked as paid");
        }
        this.status = CommissionStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    public void markAsPaymentSubmitted() {
        if (this.status != CommissionStatus.PENDING && this.status != CommissionStatus.OVERDUE) {
            throw new IllegalStateException("Can only submit payment for pending or overdue commissions");
        }
        this.status = CommissionStatus.PAYMENT_SUBMITTED;
    }

    public void markAsOverdue() {
        if (this.status == CommissionStatus.PENDING && LocalDateTime.now().isAfter(this.dueDate)) {
            this.status = CommissionStatus.OVERDUE;
        }
    }

    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(this.dueDate) && 
               (this.status == CommissionStatus.PENDING || this.status == CommissionStatus.OVERDUE);
    }
    
    public void setStatus(CommissionStatus status) {
        this.status = status;
    }
}

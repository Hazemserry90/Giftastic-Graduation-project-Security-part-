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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import com.giftastic.giftastic.common.pricing.CommissionRates;

@Entity
@Table(name = "commission_rules", indexes = {
    @Index(name = "idx_rule_type", columnList = "type"),
    @Index(name = "idx_rule_supplier", columnList = "supplier_id"),
    @Index(name = "idx_rule_active", columnList = "active"),
    @Index(name = "idx_rule_dates", columnList = "start_date, end_date")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommissionRule {

    @Id
    @NonNull
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private RuleType type;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(nullable = false, precision = 5, scale = 4)
    @NonNull
    private BigDecimal rate;

    @Column(nullable = false, name = "start_date")
    @NonNull
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false, name = "created_at")
    @NonNull
    private LocalDateTime createdAt;

    @Column(nullable = false, name = "created_by")
    @NonNull
    private UUID createdBy;

    private CommissionRule(UUID id, RuleType type, UUID supplierId, BigDecimal rate,
                          LocalDateTime startDate, LocalDateTime endDate, UUID createdBy) {
        this.id = id;
        this.type = type;
        this.supplierId = supplierId;
        this.rate = rate;
        this.startDate = startDate;
        this.endDate = endDate;
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.createdBy = createdBy;
    }

    public static CommissionRule createGlobal(BigDecimal rate, LocalDateTime startDate, 
                                             LocalDateTime endDate, UUID createdBy) {
        BigDecimal normalizedRate = CommissionRates.requireFraction(rate);
        return new CommissionRule(UUID.randomUUID(), RuleType.GLOBAL, null, normalizedRate,
                                startDate, endDate, createdBy);
    }

    public static CommissionRule createSupplierSpecific(UUID supplierId, BigDecimal rate,
                                                       LocalDateTime startDate, LocalDateTime endDate,
                                                       UUID createdBy) {
        if (supplierId == null) {
            throw new IllegalArgumentException("Supplier ID required for supplier-specific rule");
        }
        BigDecimal normalizedRate = CommissionRates.requireFraction(rate);
        return new CommissionRule(UUID.randomUUID(), RuleType.SUPPLIER_SPECIFIC, supplierId,
                                normalizedRate, startDate, endDate, createdBy);
    }

    public void deactivate() {
        this.active = false;
    }

    public boolean isApplicableAt(LocalDateTime date) {
        if (!active) return false;
        if (date.isBefore(startDate)) return false;
        if (endDate != null && date.isAfter(endDate)) return false;
        return true;
    }

    public boolean appliesToSupplier(UUID supplierId) {
        if (type == RuleType.GLOBAL) return true;
        return this.supplierId != null && this.supplierId.equals(supplierId);
    }
}

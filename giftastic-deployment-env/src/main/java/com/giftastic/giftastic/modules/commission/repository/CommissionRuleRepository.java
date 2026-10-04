package com.giftastic.giftastic.modules.commission.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.commission.domain.CommissionRule;
import com.giftastic.giftastic.modules.commission.domain.RuleType;

@Repository
public interface CommissionRuleRepository extends JpaRepository<CommissionRule, UUID> {

    List<CommissionRule> findByActiveTrue();

    boolean existsByActiveTrue();

    @Query("SELECT r FROM CommissionRule r WHERE r.active = true AND r.type = 'SUPPLIER_SPECIFIC' AND r.supplierId = :supplierId AND r.startDate <= :date AND (r.endDate IS NULL OR r.endDate >= :date)")
    Optional<CommissionRule> findActiveSupplierRule(UUID supplierId, LocalDateTime date);

    @Query("SELECT r FROM CommissionRule r WHERE r.active = true AND r.type = 'GLOBAL' AND r.startDate <= :date AND (r.endDate IS NULL OR r.endDate >= :date)")
    Optional<CommissionRule> findActiveGlobalRule(LocalDateTime date);

    List<CommissionRule> findBySupplierIdAndActiveTrue(UUID supplierId);

    List<CommissionRule> findByTypeAndActiveTrue(RuleType type);
}

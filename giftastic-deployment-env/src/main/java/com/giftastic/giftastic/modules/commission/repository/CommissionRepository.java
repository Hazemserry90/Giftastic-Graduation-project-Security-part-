package com.giftastic.giftastic.modules.commission.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.commission.domain.CommissionStatus;

@Repository
public interface CommissionRepository extends JpaRepository<Commission, UUID> {

    List<Commission> findBySupplierIdOrderByDueDateAsc(UUID supplierId);

    List<Commission> findByStatusOrderByDueDateAsc(CommissionStatus status);

    @Query("SELECT c FROM Commission c WHERE c.status IN ('PENDING', 'OVERDUE') ORDER BY c.dueDate ASC")
    List<Commission> findUnpaidOrderByDueDateAsc();

    List<Commission> findBySupplierIdAndStatus(UUID supplierId, CommissionStatus status);

    @Query("SELECT c FROM Commission c WHERE c.status = 'PENDING' AND c.dueDate < :now")
    List<Commission> findOverdueCommissions(LocalDateTime now);

    List<Commission> findByOrderId(UUID orderId);
    Optional<Commission> findByOrderIdAndSupplierId(UUID orderId, UUID supplierId);
    List<Commission> findByDirectionOrderByCreatedAtDesc(CommissionDirection direction);
}

package com.giftastic.giftastic.modules.commission.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.commission.domain.CommissionPaymentRequest;
import com.giftastic.giftastic.modules.commission.domain.PaymentRequestStatus;

@Repository
public interface CommissionPaymentRequestRepository extends JpaRepository<CommissionPaymentRequest, UUID> {

    List<CommissionPaymentRequest> findByStatusOrderBySubmittedAtAsc(PaymentRequestStatus status);

    List<CommissionPaymentRequest> findAllByOrderBySubmittedAtDesc();

    List<CommissionPaymentRequest> findBySupplierIdOrderBySubmittedAtDesc(UUID supplierId);

    List<CommissionPaymentRequest> findByCommissionIdOrderBySubmittedAtAsc(UUID commissionId);

    Optional<CommissionPaymentRequest> findByCommissionIdAndStatus(UUID commissionId, PaymentRequestStatus status);
}

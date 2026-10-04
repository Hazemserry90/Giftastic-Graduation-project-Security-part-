package com.giftastic.giftastic.modules.commission.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.commission.domain.AssistanceStatus;
import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceRequest;

@Repository
public interface OrderAssistanceRequestRepository extends JpaRepository<OrderAssistanceRequest, UUID> {

    List<OrderAssistanceRequest> findByStatusOrderByRequestedAtAsc(AssistanceStatus status);

    List<OrderAssistanceRequest> findBySupplierIdOrderByRequestedAtDesc(UUID supplierId);

    List<OrderAssistanceRequest> findByOrderId(UUID orderId);
}

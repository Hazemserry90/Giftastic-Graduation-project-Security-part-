package com.giftastic.giftastic.modules.commission.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceMessage;

public interface OrderAssistanceMessageRepository extends JpaRepository<OrderAssistanceMessage, UUID> {
    List<OrderAssistanceMessage> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}

package com.giftastic.giftastic.modules.admin.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.admin.domain.AdminRequest;
import com.giftastic.giftastic.modules.admin.domain.AdminRequestStatus;

public interface AdminRequestRepository extends JpaRepository<AdminRequest, UUID> {
    
    List<AdminRequest> findByStatus(AdminRequestStatus status);
    
    List<AdminRequest> findByUserIdOrderByRequestedAtDesc(UUID userId);
    
    Optional<AdminRequest> findFirstByUserIdAndStatusOrderByRequestedAtDesc(UUID userId, AdminRequestStatus status);
    
    boolean existsByUserIdAndStatusAndCanReapplyAtAfter(UUID userId, AdminRequestStatus status, LocalDateTime now);
}

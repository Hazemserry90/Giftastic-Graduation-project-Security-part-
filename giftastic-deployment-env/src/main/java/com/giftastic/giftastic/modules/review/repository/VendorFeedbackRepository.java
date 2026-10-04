package com.giftastic.giftastic.modules.review.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.VendorFeedback;

@Repository
public interface VendorFeedbackRepository extends JpaRepository<VendorFeedback, UUID> {
    Page<VendorFeedback> findByVendorId(UUID vendorId, Pageable pageable);
    Page<VendorFeedback> findByVendorIdAndStatus(UUID vendorId, ReviewStatus status, Pageable pageable);
    Page<VendorFeedback> findByStatus(ReviewStatus status, Pageable pageable);
    boolean existsByUserIdAndOrderId(UUID userId, UUID orderId);
    List<VendorFeedback> findByOrderId(UUID orderId);
}

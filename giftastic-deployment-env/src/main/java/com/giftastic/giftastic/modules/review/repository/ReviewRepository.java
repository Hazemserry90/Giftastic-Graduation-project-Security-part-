package com.giftastic.giftastic.modules.review.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Page<Review> findByEntityIdAndStatus(UUID entityId, ReviewStatus status, Pageable pageable);
    Page<Review> findByEntityIdAndReviewTypeAndStatus(UUID entityId, ReviewType reviewType, ReviewStatus status, Pageable pageable);
    Page<Review> findByUserId(UUID userId, Pageable pageable);
    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);
    boolean existsByUserIdAndEntityIdAndReviewType(UUID userId, UUID entityId, ReviewType reviewType);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.entityId = :entityId AND r.reviewType = :reviewType AND r.status = 'APPROVED'")
    Double getAverageRating(UUID entityId, ReviewType reviewType);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.entityId = :entityId AND r.reviewType = :reviewType AND r.status = 'APPROVED'")
    Long getReviewCount(UUID entityId, ReviewType reviewType);
    
    List<Review> findByEntityIdAndReviewTypeAndStatusOrderByCreatedAtDesc(UUID entityId, ReviewType reviewType, ReviewStatus status);
}

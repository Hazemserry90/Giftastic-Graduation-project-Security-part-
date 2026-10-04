package com.giftastic.giftastic.modules.review.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;
import com.giftastic.giftastic.modules.review.dto.CreateReviewRequest;
import com.giftastic.giftastic.modules.review.repository.ReviewRepository;
import com.giftastic.giftastic.modules.review.repository.UserReviewRestrictionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final UserReviewRestrictionRepository restrictionRepository;
    private final ProductRepository productRepository;
    private final ContentModerationService contentModerationService;
    
    @Override
    @Transactional
    public Review createReview(UUID userId, CreateReviewRequest request) {
        checkUserRestrictions(userId, request.comment() != null && !request.comment().isBlank());
        
        if (reviewRepository.existsByUserIdAndEntityIdAndReviewType(userId, request.entityId(), request.reviewType())) {
            throw new IllegalStateException("User has already reviewed this entity");
        }
        
        double contentScore = 1.0;
        if (request.comment() != null && !request.comment().isBlank()) {
            contentScore = contentModerationService.analyzeContent(request.comment());
        }
        
        Review review = Review.create(
            userId,
            request.reviewType(),
            request.entityId(),
            request.rating(),
            request.comment(),
            request.isAnonymous(),
            contentScore,
            request.orderId()
        );
        
        Review saved = reviewRepository.save(review);
        
        if (saved.getStatus() == ReviewStatus.APPROVED && request.reviewType() == ReviewType.PRODUCT) {
            updateProductRatings(request.entityId());
        }
        
        log.info("Review created: id={}, type={}, entityId={}, status={}", 
            saved.getId(), saved.getReviewType(), saved.getEntityId(), saved.getStatus());
        
        return saved;
    }
    
    @Override
    public List<Review> getReviewsByEntity(ReviewType reviewType, UUID entityId) {
        return reviewRepository.findByEntityIdAndReviewTypeAndStatusOrderByCreatedAtDesc(
            entityId, reviewType, ReviewStatus.APPROVED
        );
    }
    
    @Override
    public List<Review> getReviewsByUser(UUID userId) {
        return reviewRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged()).getContent();
    }
    
    @Override
    public List<Review> getPendingReviews() {
        return reviewRepository.findByStatus(ReviewStatus.PENDING_REVIEW, org.springframework.data.domain.Pageable.unpaged()).getContent();
    }
    
    @Override
    public List<Review> getReviewsByStatus(ReviewStatus status) {
        return reviewRepository.findByStatus(status, org.springframework.data.domain.Pageable.unpaged()).getContent();
    }
    
    @Override
    @Transactional
    public Review approveReview(UUID reviewId, UUID moderatorId, String notes) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        review.approve(moderatorId, notes);
        Review saved = reviewRepository.save(review);
        
        if (review.getReviewType() == ReviewType.PRODUCT) {
            updateProductRatings(review.getEntityId());
        }
        
        log.info("Review approved: id={}, moderatorId={}", reviewId, moderatorId);
        
        return saved;
    }
    
    @Override
    @Transactional
    public Review rejectReview(UUID reviewId, UUID moderatorId, String notes) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        review.reject(moderatorId, notes);
        Review saved = reviewRepository.save(review);
        
        log.info("Review rejected: id={}, moderatorId={}", reviewId, moderatorId);
        
        return saved;
    }
    
    @Override
    public void checkUserRestrictions(UUID userId, boolean needsCommentPermission) {
        restrictionRepository.findByUserId(userId).ifPresent(restriction -> {
            if (restriction.isActive()) {
                if (!restriction.isCanReview()) {
                    throw new IllegalStateException("User is restricted from submitting reviews");
                }
                if (needsCommentPermission && !restriction.isCanComment()) {
                    throw new IllegalStateException("User is restricted from submitting comments");
                }
            }
        });
    }
    
    @Override
    @Transactional
    public void updateProductRatings(UUID productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        Double avgRating = reviewRepository.getAverageRating(productId, ReviewType.PRODUCT);
        Long reviewCount = reviewRepository.getReviewCount(productId, ReviewType.PRODUCT);
        
        BigDecimal averageRating = avgRating != null 
            ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        product.updateRating(averageRating, reviewCount != null ? reviewCount.intValue() : 0);
        productRepository.save(product);
        
        log.info("Product ratings updated: productId={}, avgRating={}, count={}", 
            productId, averageRating, reviewCount);
    }
}

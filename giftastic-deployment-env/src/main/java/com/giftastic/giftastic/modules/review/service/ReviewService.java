package com.giftastic.giftastic.modules.review.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;
import com.giftastic.giftastic.modules.review.dto.CreateReviewRequest;

public interface ReviewService {
    
    Review createReview(UUID userId, CreateReviewRequest request);
    
    List<Review> getReviewsByEntity(ReviewType reviewType, UUID entityId);
    
    List<Review> getReviewsByUser(UUID userId);
    
    List<Review> getPendingReviews();
    
    List<Review> getReviewsByStatus(ReviewStatus status);
    
    Review approveReview(UUID reviewId, UUID moderatorId, String notes);
    
    Review rejectReview(UUID reviewId, UUID moderatorId, String notes);
    
    void checkUserRestrictions(UUID userId, boolean needsCommentPermission);
    
    void updateProductRatings(UUID productId);
}

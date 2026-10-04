package com.giftastic.giftastic.modules.review.service;

import java.util.Optional;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.UserReviewRestriction;
import com.giftastic.giftastic.modules.review.dto.UpdateRestrictionRequest;

public interface UserReviewRestrictionService {
    
    UserReviewRestriction createOrUpdateRestriction(UUID userId, UUID restrictedBy, UpdateRestrictionRequest request);
    
    Optional<UserReviewRestriction> getRestriction(UUID userId);
    
    void removeRestriction(UUID userId);
}

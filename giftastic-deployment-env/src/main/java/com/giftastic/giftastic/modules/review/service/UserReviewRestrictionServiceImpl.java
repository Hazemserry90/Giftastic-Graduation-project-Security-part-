package com.giftastic.giftastic.modules.review.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.review.domain.UserReviewRestriction;
import com.giftastic.giftastic.modules.review.dto.UpdateRestrictionRequest;
import com.giftastic.giftastic.modules.review.repository.UserReviewRestrictionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserReviewRestrictionServiceImpl implements UserReviewRestrictionService {
    
    private final UserReviewRestrictionRepository restrictionRepository;
    
    @Override
    @Transactional
    public UserReviewRestriction createOrUpdateRestriction(UUID userId, UUID restrictedBy, UpdateRestrictionRequest request) {
        Optional<UserReviewRestriction> existing = restrictionRepository.findByUserId(userId);
        
        UserReviewRestriction restriction;
        if (existing.isPresent()) {
            restriction = existing.get();
            restriction.updateRestrictions(request.canComment(), request.canReview(), request.expiresAt());
            log.info("Updated restriction for user: userId={}, canComment={}, canReview={}", 
                userId, request.canComment(), request.canReview());
        } else {
            restriction = UserReviewRestriction.create(
                userId,
                request.canComment(),
                request.canReview(),
                restrictedBy,
                request.reason(),
                request.expiresAt()
            );
            log.info("Created restriction for user: userId={}, canComment={}, canReview={}", 
                userId, request.canComment(), request.canReview());
        }
        
        return restrictionRepository.save(restriction);
    }
    
    @Override
    public Optional<UserReviewRestriction> getRestriction(UUID userId) {
        return restrictionRepository.findByUserId(userId);
    }
    
    @Override
    @Transactional
    public void removeRestriction(UUID userId) {
        restrictionRepository.findByUserId(userId).ifPresent(restriction -> {
            restrictionRepository.delete(restriction);
            log.info("Removed restriction for user: userId={}", userId);
        });
    }
}

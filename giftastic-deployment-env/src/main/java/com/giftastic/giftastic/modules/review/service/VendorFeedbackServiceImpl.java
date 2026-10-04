package com.giftastic.giftastic.modules.review.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.VendorFeedback;
import com.giftastic.giftastic.modules.review.dto.CreateVendorFeedbackRequest;
import com.giftastic.giftastic.modules.review.repository.UserReviewRestrictionRepository;
import com.giftastic.giftastic.modules.review.repository.VendorFeedbackRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorFeedbackServiceImpl implements VendorFeedbackService {
    
    private final VendorFeedbackRepository feedbackRepository;
    private final UserReviewRestrictionRepository restrictionRepository;
    private final ContentModerationService contentModerationService;
    
    @Override
    @Transactional
    public VendorFeedback createFeedback(UUID userId, CreateVendorFeedbackRequest request) {
        checkUserRestrictions(userId);
        
        if (feedbackRepository.existsByUserIdAndOrderId(userId, request.orderId())) {
            throw new IllegalStateException("User has already submitted feedback for this order");
        }
        
        double contentScore = contentModerationService.analyzeContent(request.feedback());
        
        VendorFeedback feedback = VendorFeedback.create(
            userId,
            request.vendorId(),
            request.orderId(),
            request.feedback(),
            contentScore
        );
        
        VendorFeedback saved = feedbackRepository.save(feedback);
        
        log.info("Vendor feedback created: id={}, vendorId={}, orderId={}, status={}", 
            saved.getId(), saved.getVendorId(), saved.getOrderId(), saved.getStatus());
        
        return saved;
    }
    
    @Override
    public List<VendorFeedback> getFeedbackByVendor(UUID vendorId) {
        return feedbackRepository.findByVendorIdAndStatus(
            vendorId, 
            ReviewStatus.APPROVED, 
            org.springframework.data.domain.Pageable.unpaged()
        ).getContent();
    }
    
    @Override
    public List<VendorFeedback> getPendingFeedback() {
        return feedbackRepository.findByStatus(
            ReviewStatus.PENDING_REVIEW, 
            org.springframework.data.domain.Pageable.unpaged()
        ).getContent();
    }
    
    @Override
    public List<VendorFeedback> getFeedbackByStatus(ReviewStatus status) {
        return feedbackRepository.findByStatus(status, org.springframework.data.domain.Pageable.unpaged()).getContent();
    }
    
    @Override
    @Transactional
    public VendorFeedback approveFeedback(UUID feedbackId, UUID moderatorId, String notes) {
        VendorFeedback feedback = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendor feedback not found"));
        
        feedback.approve(moderatorId, notes);
        VendorFeedback saved = feedbackRepository.save(feedback);
        
        log.info("Vendor feedback approved: id={}, moderatorId={}", feedbackId, moderatorId);
        
        return saved;
    }
    
    @Override
    @Transactional
    public VendorFeedback rejectFeedback(UUID feedbackId, UUID moderatorId, String notes) {
        VendorFeedback feedback = feedbackRepository.findById(feedbackId)
            .orElseThrow(() -> new ResourceNotFoundException("Vendor feedback not found"));
        
        feedback.reject(moderatorId, notes);
        VendorFeedback saved = feedbackRepository.save(feedback);
        
        log.info("Vendor feedback rejected: id={}, moderatorId={}", feedbackId, moderatorId);
        
        return saved;
    }
    
    @Override
    public boolean hasUserSubmittedFeedbackForOrder(UUID userId, UUID orderId) {
        return feedbackRepository.existsByUserIdAndOrderId(userId, orderId);
    }
    
    private void checkUserRestrictions(UUID userId) {
        restrictionRepository.findByUserId(userId).ifPresent(restriction -> {
            if (restriction.isActive() && !restriction.isCanComment()) {
                throw new IllegalStateException("User is restricted from submitting feedback");
            }
        });
    }
}

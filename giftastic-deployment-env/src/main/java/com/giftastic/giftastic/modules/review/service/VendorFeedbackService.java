package com.giftastic.giftastic.modules.review.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.VendorFeedback;
import com.giftastic.giftastic.modules.review.dto.CreateVendorFeedbackRequest;

public interface VendorFeedbackService {
    
    VendorFeedback createFeedback(UUID userId, CreateVendorFeedbackRequest request);
    
    List<VendorFeedback> getFeedbackByVendor(UUID vendorId);
    
    List<VendorFeedback> getPendingFeedback();
    
    List<VendorFeedback> getFeedbackByStatus(ReviewStatus status);
    
    VendorFeedback approveFeedback(UUID feedbackId, UUID moderatorId, String notes);
    
    VendorFeedback rejectFeedback(UUID feedbackId, UUID moderatorId, String notes);
    
    boolean hasUserSubmittedFeedbackForOrder(UUID userId, UUID orderId);
}

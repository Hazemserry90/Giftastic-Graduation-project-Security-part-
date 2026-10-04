package com.giftastic.giftastic.modules.review.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.UserPrincipal;
import com.giftastic.giftastic.modules.review.domain.Review;
import com.giftastic.giftastic.modules.review.domain.ReviewStatus;
import com.giftastic.giftastic.modules.review.domain.ReviewType;
import com.giftastic.giftastic.modules.review.dto.CreateReviewRequest;
import com.giftastic.giftastic.modules.review.dto.CreateVendorFeedbackRequest;
import com.giftastic.giftastic.modules.review.dto.ModerateReviewRequest;
import com.giftastic.giftastic.modules.review.dto.ReviewResponse;
import com.giftastic.giftastic.modules.review.dto.UpdateRestrictionRequest;
import com.giftastic.giftastic.modules.review.dto.UserReviewRestrictionResponse;
import com.giftastic.giftastic.modules.review.dto.VendorFeedbackResponse;
import com.giftastic.giftastic.modules.review.service.ReviewService;
import com.giftastic.giftastic.modules.review.service.UserReviewRestrictionService;
import com.giftastic.giftastic.modules.review.service.VendorFeedbackService;
import com.giftastic.giftastic.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewService reviewService;
    private final VendorFeedbackService feedbackService;
    private final UserReviewRestrictionService restrictionService;
    private final UserRepository userRepository;
    
    // ── User endpoints ─────────────────────────────────────────────────────────
    
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateReviewRequest request) {
        var review = reviewService.createReview(principal.getUserId(), request);
        return ResponseEntity.status(201).body(toReviewResponse(review, true));
    }
    
    @GetMapping("/entity/{entityId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByEntity(
            @PathVariable UUID entityId,
            @RequestParam ReviewType reviewType) {
        var reviews = reviewService.getReviewsByEntity(reviewType, entityId);
        return ResponseEntity.ok(reviews.stream()
                .map(review -> toReviewResponse(review, false))
                .toList());
    }
    
    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(
            @AuthenticationPrincipal UserPrincipal principal) {
        var reviews = reviewService.getReviewsByUser(principal.getUserId());
        return ResponseEntity.ok(reviews.stream()
                .map(review -> toReviewResponse(review, true))
                .toList());
    }
    
    @PostMapping("/vendor-feedback")
    public ResponseEntity<VendorFeedbackResponse> createVendorFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateVendorFeedbackRequest request) {
        var feedback = feedbackService.createFeedback(principal.getUserId(), request);
        return ResponseEntity.status(201).body(VendorFeedbackResponse.from(feedback));
    }
    
    // ── Moderator endpoints ────────────────────────────────────────────────────
    
    @GetMapping("/pending")
    @PreAuthorize("hasPermission(null, 'VIEW_REVIEWS')")
    public ResponseEntity<List<ReviewResponse>> getPendingReviews() {
        var reviews = reviewService.getPendingReviews();
        return ResponseEntity.ok(reviews.stream()
                .map(review -> toReviewResponse(review, true))
                .toList());
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasPermission(null, 'VIEW_REVIEWS')")
    public ResponseEntity<List<ReviewResponse>> getReviewsByStatus(@PathVariable ReviewStatus status) {
        var reviews = reviewService.getReviewsByStatus(status);
        return ResponseEntity.ok(reviews.stream()
                .map(review -> toReviewResponse(review, true))
                .toList());
    }
    
    @PatchMapping("/{reviewId}/approve")
    @PreAuthorize("hasPermission(null, 'MODERATE_REVIEWS')")
    public ResponseEntity<ReviewResponse> approveReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID reviewId,
            @RequestBody(required = false) ModerateReviewRequest request) {
        String notes = request != null ? request.moderatorNotes() : null;
        var review = reviewService.approveReview(reviewId, principal.getUserId(), notes);
        return ResponseEntity.ok(toReviewResponse(review, true));
    }
    
    @PatchMapping("/{reviewId}/reject")
    @PreAuthorize("hasPermission(null, 'MODERATE_REVIEWS')")
    public ResponseEntity<ReviewResponse> rejectReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID reviewId,
            @RequestBody(required = false) ModerateReviewRequest request) {
        String notes = request != null ? request.moderatorNotes() : null;
        var review = reviewService.rejectReview(reviewId, principal.getUserId(), notes);
        return ResponseEntity.ok(toReviewResponse(review, true));
    }
    
    @GetMapping("/vendor-feedback/pending")
    @PreAuthorize("hasPermission(null, 'VIEW_VENDOR_FEEDBACK')")
    public ResponseEntity<List<VendorFeedbackResponse>> getPendingFeedback() {
        var feedback = feedbackService.getPendingFeedback();
        return ResponseEntity.ok(feedback.stream().map(VendorFeedbackResponse::from).toList());
    }
    
    @GetMapping("/vendor-feedback/status/{status}")
    @PreAuthorize("hasPermission(null, 'VIEW_VENDOR_FEEDBACK')")
    public ResponseEntity<List<VendorFeedbackResponse>> getFeedbackByStatus(@PathVariable ReviewStatus status) {
        var feedback = feedbackService.getFeedbackByStatus(status);
        return ResponseEntity.ok(feedback.stream().map(VendorFeedbackResponse::from).toList());
    }
    
    @PatchMapping("/vendor-feedback/{feedbackId}/approve")
    @PreAuthorize("hasPermission(null, 'VIEW_VENDOR_FEEDBACK')")
    public ResponseEntity<VendorFeedbackResponse> approveFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID feedbackId,
            @RequestBody(required = false) ModerateReviewRequest request) {
        String notes = request != null ? request.moderatorNotes() : null;
        var feedback = feedbackService.approveFeedback(feedbackId, principal.getUserId(), notes);
        return ResponseEntity.ok(VendorFeedbackResponse.from(feedback));
    }
    
    @PatchMapping("/vendor-feedback/{feedbackId}/reject")
    @PreAuthorize("hasPermission(null, 'VIEW_VENDOR_FEEDBACK')")
    public ResponseEntity<VendorFeedbackResponse> rejectFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID feedbackId,
            @RequestBody(required = false) ModerateReviewRequest request) {
        String notes = request != null ? request.moderatorNotes() : null;
        var feedback = feedbackService.rejectFeedback(feedbackId, principal.getUserId(), notes);
        return ResponseEntity.ok(VendorFeedbackResponse.from(feedback));
    }
    
    // ── User restriction endpoints ─────────────────────────────────────────────
    
    @PostMapping("/restrictions/{userId}")
    @PreAuthorize("hasPermission(null, 'MUTE_USERS')")
    public ResponseEntity<UserReviewRestrictionResponse> createOrUpdateRestriction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody UpdateRestrictionRequest request) {
        var restriction = restrictionService.createOrUpdateRestriction(userId, principal.getUserId(), request);
        return ResponseEntity.ok(UserReviewRestrictionResponse.from(restriction));
    }
    
    @GetMapping("/restrictions/{userId}")
    @PreAuthorize("hasPermission(null, 'VIEW_REVIEWS')")
    public ResponseEntity<UserReviewRestrictionResponse> getRestriction(@PathVariable UUID userId) {
        return restrictionService.getRestriction(userId)
            .map(restriction -> ResponseEntity.ok(UserReviewRestrictionResponse.from(restriction)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/restrictions/{userId}")
    @PreAuthorize("hasPermission(null, 'MUTE_USERS')")
    public ResponseEntity<Void> removeRestriction(@PathVariable UUID userId) {
        restrictionService.removeRestriction(userId);
        return ResponseEntity.noContent().build();
    }

    private ReviewResponse toReviewResponse(Review review, boolean includeAnonymousAuthor) {
        String authorName = !review.isAnonymous() || includeAnonymousAuthor
                ? resolveAuthorName(review)
                : null;
        return ReviewResponse.from(review, authorName);
    }

    private String resolveAuthorName(Review review) {
        return userRepository.findById(review.getUserId())
                .map(user -> user.getFullName())
                .filter(name -> name != null && !name.isBlank())
                .orElse(null);
    }
}

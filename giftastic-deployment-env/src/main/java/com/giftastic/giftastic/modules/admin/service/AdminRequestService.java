package com.giftastic.giftastic.modules.admin.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.admin.domain.AdminRequest;
import com.giftastic.giftastic.modules.admin.domain.AdminRequestStatus;
import com.giftastic.giftastic.modules.admin.dto.AdminRequestDTO;
import com.giftastic.giftastic.modules.admin.repository.AdminRequestRepository;
import com.giftastic.giftastic.modules.admin.service.AdminService;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminRequestService {

    private final AdminRequestRepository adminRequestRepository;
    private final UserRepository userRepository;
    private final AdminService adminService;
    private final NotificationService notificationService;

    @Transactional
    public AdminRequestDTO submitRequest(UUID userId, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user is already an admin
        if (adminService.getAdminDetails(userId).isPresent()) {
            throw new IllegalStateException("User is already an admin");
        }

        // Check cooldown period
        boolean onCooldown = adminRequestRepository.existsByUserIdAndStatusAndCanReapplyAtAfter(
                userId, AdminRequestStatus.REJECTED, LocalDateTime.now());
        
        if (onCooldown) {
            throw new IllegalStateException("You must wait 3 months before submitting another request");
        }

        // Check for pending request
        boolean hasPending = adminRequestRepository.findFirstByUserIdAndStatusOrderByRequestedAtDesc(
                userId, AdminRequestStatus.PENDING).isPresent();
        
        if (hasPending) {
            throw new IllegalStateException("You already have a pending admin request");
        }

        AdminRequest request = AdminRequest.create(userId, message);
        adminRequestRepository.save(request);

        return toDTO(request, user);
    }

    @Transactional(readOnly = true)
    public List<AdminRequestDTO> getPendingRequests() {
        return adminRequestRepository.findByStatus(AdminRequestStatus.PENDING)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminRequestDTO> getUserRequests(UUID userId) {
        return adminRequestRepository.findByUserIdOrderByRequestedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveRequest(UUID requestId, UUID reviewerId) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != AdminRequestStatus.PENDING) {
            throw new IllegalStateException("Request has already been reviewed");
        }

        request.approve(reviewerId);
        adminRequestRepository.save(request);

        // Promote user to admin
        adminService.promoteToAdmin(request.getUserId());

        // Send notification
        notificationService.sendNotification(
                request.getUserId(),
                "Admin Request Approved",
                "Congratulations! Your request to become an admin has been approved.",
                NotificationType.SYSTEM_ALERT,
                null
        );
    }

    @Transactional
    public void rejectRequest(UUID requestId, UUID reviewerId, String notes) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != AdminRequestStatus.PENDING) {
            throw new IllegalStateException("Request has already been reviewed");
        }

        request.reject(reviewerId, notes);
        adminRequestRepository.save(request);

        // Send notification
        notificationService.sendNotification(
                request.getUserId(),
                "Admin Request Rejected",
                "Your request to become an admin has been rejected. " + 
                (notes != null ? "Reason: " + notes : "") + 
                " You can reapply in 3 months.",
                NotificationType.SYSTEM_ALERT,
                null
        );
    }

    @Transactional
    public void invalidateRequest(UUID requestId, UUID reviewerId, String notes) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != AdminRequestStatus.PENDING) {
            throw new IllegalStateException("Request has already been reviewed");
        }

        request.invalidate(reviewerId, notes);
        adminRequestRepository.save(request);

        // Send notification
        notificationService.sendNotification(
                request.getUserId(),
                "Admin Request Invalidated",
                "Your admin request has been invalidated. " + (notes != null ? "Reason: " + notes : ""),
                NotificationType.SYSTEM_ALERT,
                null
        );
    }

    @Transactional
    public void resetCooldown(UUID requestId, UUID adminId) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        request.resetCooldown(adminId);
        adminRequestRepository.save(request);
    }

    private AdminRequestDTO toDTO(AdminRequest request) {
        User user = userRepository.findById(request.getUserId()).orElse(null);
        return toDTO(request, user);
    }

    private AdminRequestDTO toDTO(AdminRequest request, User user) {
        return new AdminRequestDTO(
                request.getId(),
                request.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getFullName() : null,
                request.getMessage(),
                request.getStatus(),
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getReviewedBy(),
                request.getReviewNotes(),
                request.getCanReapplyAt()
        );
    }
}

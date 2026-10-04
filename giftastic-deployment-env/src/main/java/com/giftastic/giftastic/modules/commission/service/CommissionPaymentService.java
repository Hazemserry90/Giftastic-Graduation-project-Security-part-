package com.giftastic.giftastic.modules.commission.service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionPaymentRequest;
import com.giftastic.giftastic.modules.commission.domain.PaymentRequestStatus;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.commission.domain.PaymentMessageSenderRole;
import com.giftastic.giftastic.modules.commission.dto.CommissionPaymentMessageDTO;
import com.giftastic.giftastic.modules.commission.dto.CommissionPaymentRequestDTO;
import com.giftastic.giftastic.modules.commission.repository.CommissionPaymentRequestRepository;
import com.giftastic.giftastic.modules.commission.repository.CommissionRepository;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommissionPaymentService {

    private final CommissionPaymentRequestRepository paymentRequestRepository;
    private final CommissionRepository commissionRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;
    private final CommissionService commissionService;
    private final AdminRepository adminRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public CommissionPaymentRequestDTO submitPayment(UUID commissionId, UUID supplierId, String message, String proofImageUrl) {
        Commission commission = commissionRepository.findById(commissionId)
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));

        if (!commission.getSupplierId().equals(supplierId)) {
            throw new IllegalArgumentException("Commission does not belong to this supplier");
        }
        commissionService.ensureVendorPortionCanChangeMoney(commission);
        if (commission.effectiveDirection() != CommissionDirection.VENDOR_TO_PLATFORM) {
            throw new IllegalStateException("Vendor payment submission is only valid for COD commission payments");
        }

        paymentRequestRepository.findByCommissionIdAndStatus(commissionId, PaymentRequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Payment request already pending for this commission");
                });

        CommissionPaymentRequest request = CommissionPaymentRequest.create(
                commissionId, supplierId, message, proofImageUrl, PaymentMessageSenderRole.VENDOR);
        commission.markAsPaymentSubmitted();

        commissionRepository.save(commission);
        paymentRequestRepository.save(request);

        notifyPaymentAdmins(
                "Commission payment submitted",
                getVendorName(supplierId) + " submitted payment proof for order " + commission.getOrderId() + ".",
                commission, request.getId());

        return toDto(request, commission);
    }

    public List<CommissionPaymentRequestDTO> getPendingPaymentRequests() {
        List<CommissionPaymentRequest> requests = paymentRequestRepository.findByStatusOrderBySubmittedAtAsc(PaymentRequestStatus.PENDING);
        return requests.stream()
                .filter(r -> commissionRepository.findById(r.getCommissionId())
                        .map(c -> c.effectiveDirection() == CommissionDirection.VENDOR_TO_PLATFORM).orElse(false))
                .map(r -> toDto(r, commissionRepository.findById(r.getCommissionId()).orElse(null)))
                .collect(Collectors.toList());
    }

    public List<CommissionPaymentRequestDTO> getPlatformPayoutRequests() {
        List<CommissionPaymentRequest> requests = paymentRequestRepository.findAllByOrderBySubmittedAtDesc();
        return latestRequestPerCommission(requests).stream()
                .filter(r -> commissionRepository.findById(r.getCommissionId())
                        .map(c -> c.effectiveDirection() == CommissionDirection.PLATFORM_TO_VENDOR).orElse(false))
                .map(r -> toDto(r, commissionRepository.findById(r.getCommissionId()).orElse(null)))
                .collect(Collectors.toList());
    }

    public List<CommissionPaymentRequestDTO> getVendorPaymentRequests(UUID supplierId) {
        List<CommissionPaymentRequest> requests = paymentRequestRepository.findBySupplierIdOrderBySubmittedAtDesc(supplierId);
        return latestRequestPerCommission(requests).stream()
                .map(r -> toDto(r, commissionRepository.findById(r.getCommissionId()).orElse(null)))
                .collect(Collectors.toList());
    }

    @Transactional
    public void approvePaymentRequest(UUID requestId, UUID adminId) {
        CommissionPaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        Commission commission = commissionRepository.findById(request.getCommissionId())
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        commissionService.ensureVendorPortionCanChangeMoney(commission);
        if (commission.effectiveDirection() != CommissionDirection.VENDOR_TO_PLATFORM) {
            throw new IllegalStateException("Vendor payouts must be reviewed by the vendor");
        }

        request.approve(adminId);
        commission.markAsPaid();

        paymentRequestRepository.save(request);
        commissionRepository.save(commission);

        notificationService.sendNotification(
                getVendorUserId(request.getSupplierId()),
                "Commission Payment Approved",
                "Your commission payment of " + commission.getCommissionAmount() + " has been verified and approved.",
                NotificationType.VENDOR_ALERT,
                "{\"commissionId\":\"" + request.getCommissionId() + "\",\"requestId\":\"" + requestId + "\"}"
        );
    }

    @Transactional
    public void rejectPaymentRequest(UUID requestId, UUID adminId, String reason) {
        CommissionPaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        String normalizedReason = requireReason(reason);

        Commission commission = commissionRepository.findById(request.getCommissionId())
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        commissionService.ensureVendorPortionCanChangeMoney(commission);

        request.reject(adminId, normalizedReason);
        request.addMessage(PaymentMessageSenderRole.PLATFORM, "Denied: " + normalizedReason);
        commission.setStatus(com.giftastic.giftastic.modules.commission.domain.CommissionStatus.PENDING);

        paymentRequestRepository.save(request);
        commissionRepository.save(commission);

        notificationService.sendNotification(
                getVendorUserId(request.getSupplierId()),
                "Commission Payment Rejected",
                "Your commission payment was rejected: " + normalizedReason + ". Please submit corrected payment details.",
                NotificationType.VENDOR_ALERT,
                "{\"commissionId\":\"" + request.getCommissionId() + "\",\"requestId\":\"" + requestId + "\",\"reason\":\"" + normalizedReason.replace("\"", "\\\"") + "\"}"
        );
    }

    @Transactional
    public CommissionPaymentRequestDTO submitPlatformPayment(UUID commissionId, UUID adminId,
                                                              String message, String proofImageUrl) {
        Commission commission = commissionRepository.findById(commissionId)
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        commissionService.ensureVendorPortionCanChangeMoney(commission);
        if (commission.effectiveDirection() != CommissionDirection.PLATFORM_TO_VENDOR) {
            throw new IllegalStateException("Platform payout is only valid for confirmed Instapay orders");
        }
        paymentRequestRepository.findByCommissionIdAndStatus(commissionId, PaymentRequestStatus.PENDING)
                .ifPresent(existing -> { throw new IllegalStateException("Payment request already pending for this commission"); });
        CommissionPaymentRequest request = CommissionPaymentRequest.create(
                commissionId, commission.getSupplierId(), message, proofImageUrl, PaymentMessageSenderRole.PLATFORM);
        commission.markAsPaymentSubmitted();
        commissionRepository.save(commission);
        paymentRequestRepository.save(request);
        notificationService.sendNotification(getVendorUserId(commission.getSupplierId()), "Vendor payout submitted",
                "The platform submitted payment of " + commission.getPayableAmount() + ". Please review the proof.",
                NotificationType.VENDOR_ALERT,
                "{\"commissionId\":\"" + commissionId + "\",\"requestId\":\"" + request.getId() + "\"}");
        return toDto(request, commission);
    }

    @Transactional
    public void reviewPlatformPayment(UUID requestId, UUID supplierId, boolean approved, String reason) {
        CommissionPaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        Commission commission = commissionRepository.findById(request.getCommissionId())
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        commissionService.ensureVendorPortionCanChangeMoney(commission);
        if (!commission.getSupplierId().equals(supplierId)) throw new IllegalArgumentException("Payout does not belong to vendor");
        if (commission.effectiveDirection() != CommissionDirection.PLATFORM_TO_VENDOR) throw new IllegalStateException("Not a vendor payout");
        if (approved) {
            request.approve(supplierId);
            commission.markAsPaid();
        } else {
            String normalizedReason = requireReason(reason);
            request.reject(supplierId, normalizedReason);
            request.addMessage(PaymentMessageSenderRole.VENDOR, "Denied: " + normalizedReason);
            commission.setStatus(com.giftastic.giftastic.modules.commission.domain.CommissionStatus.PENDING);
        }
        paymentRequestRepository.save(request);
        commissionRepository.save(commission);
        notifyPaymentAdmins(
                approved ? "Vendor payout confirmed" : "Vendor payout needs follow-up",
                getVendorName(supplierId) + (approved ? " confirmed receipt for order " : " requested follow-up for order ")
                        + commission.getOrderId() + ".",
                commission, requestId);
    }

    @Transactional
    public CommissionPaymentRequestDTO addVendorMessage(UUID requestId, UUID supplierId, String message) {
        CommissionPaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        Commission commission = commissionRepository.findById(request.getCommissionId())
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        ensureRequestCanReceiveMessages(request);
        if (commission.effectiveDirection() != CommissionDirection.VENDOR_TO_PLATFORM) {
            throw new IllegalStateException("The receiver can only respond by approving or denying with a reason");
        }
        if (!commission.getSupplierId().equals(supplierId)) {
            throw new IllegalArgumentException("Payment request does not belong to vendor");
        }
        request.addMessage(PaymentMessageSenderRole.VENDOR, message);
        paymentRequestRepository.save(request);
        notifyPaymentAdmins(
                "Payment request message",
                getVendorName(supplierId) + " sent a payment request message for order " + commission.getOrderId() + ".",
                commission, requestId);
        return toDto(request, commission);
    }

    @Transactional
    public CommissionPaymentRequestDTO addPlatformMessage(UUID requestId, String message) {
        CommissionPaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        Commission commission = commissionRepository.findById(request.getCommissionId())
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        ensureRequestCanReceiveMessages(request);
        if (commission.effectiveDirection() != CommissionDirection.PLATFORM_TO_VENDOR) {
            throw new IllegalStateException("The receiver can only respond by approving or denying with a reason");
        }
        request.addMessage(PaymentMessageSenderRole.PLATFORM, message);
        paymentRequestRepository.save(request);
        notificationService.sendNotification(
                getVendorUserId(request.getSupplierId()),
                "Payment request message",
                "Giftastic sent a payment request message for order " + commission.getOrderId() + ".",
                NotificationType.VENDOR_ALERT,
                metadata(commission, requestId)
        );
        return toDto(request, commission);
    }

    private String getVendorName(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(v -> v.getStoreName())
                .orElse("Unknown Vendor");
    }

    private UUID getVendorUserId(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(Vendor::getUserId)
                .orElse(supplierId);
    }

    private CommissionPaymentRequestDTO toDto(CommissionPaymentRequest request, Commission commission) {
        Order order = commission == null ? null : orderRepository.findById(commission.getOrderId()).orElse(null);
        UUID vendorUserId = vendorRepository.findBySupplierId(request.getSupplierId()).map(Vendor::getUserId).orElse(null);
        List<CommissionPaymentMessageDTO> messages = paymentRequestRepository
                .findByCommissionIdOrderBySubmittedAtAsc(request.getCommissionId())
                .stream()
                .flatMap(paymentRequest -> paymentRequest.getMessages().stream())
                .map(CommissionPaymentMessageDTO::from)
                .toList();
        return CommissionPaymentRequestDTO.from(request, getVendorName(request.getSupplierId()), commission, order, vendorUserId, messages);
    }

    private void notifyPaymentAdmins(String title, String message, Commission commission, UUID requestId) {
        adminRepository.findAll().stream()
                .filter(admin -> admin.hasPermission(AdminPermission.REVIEW_COMMISSION_PAYMENTS)
                        || admin.hasPermission(AdminPermission.MANAGE_VENDOR_PAYOUTS))
                .forEach(admin -> notificationService.sendNotification(
                        admin.getUserId(), title, message, NotificationType.REMINDER, metadata(commission, requestId)));
    }

    private String metadata(Commission commission, UUID requestId) {
        return "{\"commissionId\":\"" + commission.getId()
                + "\",\"orderId\":\"" + commission.getOrderId()
                + "\",\"requestId\":\"" + requestId + "\"}";
    }

    private String requireReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        return reason.trim();
    }

    private void ensureRequestCanReceiveMessages(CommissionPaymentRequest request) {
        if (request.getStatus() != PaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Messages can only be added while a payment request is pending");
        }
    }

    private List<CommissionPaymentRequest> latestRequestPerCommission(List<CommissionPaymentRequest> requests) {
        Map<UUID, CommissionPaymentRequest> latest = new LinkedHashMap<>();
        for (CommissionPaymentRequest request : requests) {
            latest.putIfAbsent(request.getCommissionId(), request);
        }
        return List.copyOf(latest.values());
    }
}

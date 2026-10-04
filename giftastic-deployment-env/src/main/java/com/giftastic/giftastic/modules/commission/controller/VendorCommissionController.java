package com.giftastic.giftastic.modules.commission.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.UserPrincipal;
import com.giftastic.giftastic.modules.commission.dto.CommissionDTO;
import com.giftastic.giftastic.modules.commission.dto.CommissionPaymentRequestDTO;
import com.giftastic.giftastic.modules.commission.dto.AssistanceMessageRequest;
import com.giftastic.giftastic.modules.commission.dto.AssistanceResolutionFeedbackRequest;
import com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO;
import com.giftastic.giftastic.modules.commission.dto.PaymentRequestMessageRequest;
import com.giftastic.giftastic.modules.commission.dto.RequestAssistanceRequest;
import com.giftastic.giftastic.modules.commission.dto.SubmitPaymentRequest;
import com.giftastic.giftastic.modules.commission.service.CommissionPaymentService;
import com.giftastic.giftastic.modules.commission.service.CommissionService;
import com.giftastic.giftastic.modules.commission.service.OrderAssistanceService;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/vendor")
@RequiredArgsConstructor
public class VendorCommissionController {

    private final CommissionService commissionService;
    private final CommissionPaymentService paymentService;
    private final OrderAssistanceService assistanceService;
    private final VendorRepository vendorRepository;

    @GetMapping("/commissions/pending")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<CommissionDTO>> getPendingCommissions(@AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        List<CommissionDTO> commissions = commissionService.getVendorPendingCommissions(supplierId);
        return ResponseEntity.ok(commissions);
    }

    @GetMapping("/commissions/history")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<CommissionDTO>> getCommissionHistory(@AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        List<CommissionDTO> commissions = commissionService.getVendorCommissionHistory(supplierId);
        return ResponseEntity.ok(commissions);
    }

    @PostMapping("/commissions/{commissionId}/urge-payment")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> urgePlatformPayment(@PathVariable UUID commissionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        commissionService.urgePlatformPayment(commissionId, getSupplierIdFromUser(principal.getUserId()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/payment-requests/{requestId}/approve")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> approvePlatformPayment(@PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        paymentService.reviewPlatformPayment(requestId, getSupplierIdFromUser(principal.getUserId()), true, null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/payment-requests/{requestId}/reject")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> rejectPlatformPayment(@PathVariable UUID requestId,
            @RequestBody com.giftastic.giftastic.modules.commission.dto.RejectPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        paymentService.reviewPlatformPayment(requestId, getSupplierIdFromUser(principal.getUserId()), false, request.reason());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/payment-requests/{requestId}/messages")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<CommissionPaymentRequestDTO> addPaymentRequestMessage(@PathVariable UUID requestId,
            @RequestBody PaymentRequestMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.addVendorMessage(
                requestId, getSupplierIdFromUser(principal.getUserId()), request.message()));
    }

    @PostMapping("/commissions/{commissionId}/submit-payment")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<CommissionPaymentRequestDTO> submitPayment(
            @PathVariable UUID commissionId,
            @RequestBody SubmitPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        CommissionPaymentRequestDTO result = paymentService.submitPayment(
                commissionId, supplierId, request.message(), request.proofImageUrl());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payment-requests")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<CommissionPaymentRequestDTO>> getPaymentRequests(@AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        List<CommissionPaymentRequestDTO> requests = paymentService.getVendorPaymentRequests(supplierId);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/orders/{orderId}/request-assistance")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<OrderAssistanceRequestDTO> requestAssistance(
            @PathVariable UUID orderId,
            @RequestBody RequestAssistanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        OrderAssistanceRequestDTO result = assistanceService.requestAssistance(orderId, supplierId, request.message());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/assistance-requests")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<OrderAssistanceRequestDTO>> getAssistanceRequests(@AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        List<OrderAssistanceRequestDTO> requests = assistanceService.getVendorRequests(supplierId);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/assistance-requests/{requestId}/message")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<OrderAssistanceRequestDTO> addAssistanceMessage(
            @PathVariable UUID requestId,
            @RequestBody AssistanceMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        OrderAssistanceRequestDTO updated = assistanceService.addVendorMessage(requestId, supplierId, request.message());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/assistance-requests/{requestId}/resolution")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<OrderAssistanceRequestDTO> confirmResolution(
            @PathVariable UUID requestId,
            @RequestBody AssistanceResolutionFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID supplierId = getSupplierIdFromUser(principal.getUserId());
        OrderAssistanceRequestDTO updated = assistanceService.confirmResolution(
                requestId, supplierId, request.resolved(), request.message());
        return ResponseEntity.ok(updated);
    }

    private UUID getSupplierIdFromUser(UUID userId) {
        return vendorRepository.findByUserId(userId)
                .map(v -> v.getSupplierId())
                .orElseThrow(() -> new IllegalStateException("Vendor not found for user"));
    }
}

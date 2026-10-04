package com.giftastic.giftastic.modules.commission.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.UserPrincipal;
import com.giftastic.giftastic.modules.commission.dto.CommissionDTO;
import com.giftastic.giftastic.modules.commission.dto.CommissionPaymentRequestDTO;
import com.giftastic.giftastic.modules.commission.dto.CommissionRuleDTO;
import com.giftastic.giftastic.modules.commission.dto.CreateRuleRequest;
import com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO;
import com.giftastic.giftastic.modules.commission.dto.RejectPaymentRequest;
import com.giftastic.giftastic.modules.commission.dto.ResolveAssistanceRequest;
import com.giftastic.giftastic.modules.commission.dto.PaymentRequestMessageRequest;
import com.giftastic.giftastic.modules.commission.dto.AssistanceMessageRequest;
import com.giftastic.giftastic.modules.commission.dto.InvalidateVendorPortionRequest;
import com.giftastic.giftastic.modules.commission.dto.UpdateOrderStatusRequest;
import com.giftastic.giftastic.modules.commission.dto.SubmitPaymentRequest;
import com.giftastic.giftastic.modules.commission.domain.AssistanceStatus;
import com.giftastic.giftastic.modules.commission.service.CommissionPaymentService;
import com.giftastic.giftastic.modules.commission.service.CommissionRuleService;
import com.giftastic.giftastic.modules.commission.service.CommissionService;
import com.giftastic.giftastic.modules.commission.service.OrderAssistanceService;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.service.OrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminCommissionController {

    private final CommissionService commissionService;
    private final CommissionPaymentService paymentService;
    private final CommissionRuleService ruleService;
    private final OrderAssistanceService assistanceService;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @GetMapping("/commissions/unpaid")
    @PreAuthorize("hasPermission(null, 'VIEW_FINANCIAL_DATA')")
    public ResponseEntity<List<CommissionDTO>> getUnpaidCommissions() {
        List<CommissionDTO> commissions = commissionService.getAllUnpaidCommissions();
        return ResponseEntity.ok(commissions);
    }

    @GetMapping("/commissions/instapay-payouts")
    @PreAuthorize("hasPermission(null, 'VIEW_FINANCIAL_DATA')")
    public ResponseEntity<List<CommissionDTO>> getInstapayPayouts() {
        return ResponseEntity.ok(commissionService.getEligibleInstapayPayouts());
    }

    @PostMapping("/commissions/{commissionId}/urge-payment")
    @PreAuthorize("hasPermission(null, 'URGE_COMMISSION_PAYMENT')")
    public ResponseEntity<Void> urgePayment(@PathVariable UUID commissionId) {
        commissionService.urgePayment(commissionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/commissions/{commissionId}/submit-payment")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_VENDOR_PAYOUTS')")
    public ResponseEntity<CommissionPaymentRequestDTO> submitVendorPayout(@PathVariable UUID commissionId,
            @RequestBody SubmitPaymentRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.submitPlatformPayment(commissionId, principal.getUserId(),
                request.message(), request.proofImageUrl()));
    }

    @GetMapping("/commissions/payment-requests/pending")
    @PreAuthorize("hasPermission(null, 'REVIEW_COMMISSION_PAYMENTS')")
    public ResponseEntity<List<CommissionPaymentRequestDTO>> getPendingPaymentRequests() {
        List<CommissionPaymentRequestDTO> requests = paymentService.getPendingPaymentRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/commissions/vendor-payout-requests")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_VENDOR_PAYOUTS')")
    public ResponseEntity<List<CommissionPaymentRequestDTO>> getVendorPayoutRequests() {
        return ResponseEntity.ok(paymentService.getPlatformPayoutRequests());
    }

    @PostMapping("/commissions/payment-requests/{requestId}/approve")
    @PreAuthorize("hasPermission(null, 'REVIEW_COMMISSION_PAYMENTS')")
    public ResponseEntity<Void> approvePaymentRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        paymentService.approvePaymentRequest(requestId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/commissions/payment-requests/{requestId}/reject")
    @PreAuthorize("hasPermission(null, 'REVIEW_COMMISSION_PAYMENTS')")
    public ResponseEntity<Void> rejectPaymentRequest(
            @PathVariable UUID requestId,
            @RequestBody RejectPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        paymentService.rejectPaymentRequest(requestId, principal.getUserId(), request.reason());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/commissions/rules")
    @PreAuthorize("hasPermission(null, 'MANAGE_COMMISSIONS')")
    public ResponseEntity<CommissionRuleDTO> createRule(
            @RequestBody CreateRuleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CommissionRuleDTO rule;
        if (request.type() == com.giftastic.giftastic.modules.commission.domain.RuleType.GLOBAL) {
            rule = ruleService.createGlobalRule(request.rate(), request.startDate(), request.endDate(), principal.getUserId());
        } else {
            rule = ruleService.createSupplierSpecificRule(request.supplierId(), request.rate(), request.startDate(), request.endDate(), principal.getUserId());
        }
        return ResponseEntity.status(201).body(rule);
    }

    @GetMapping("/commissions/rules")
    @PreAuthorize("hasPermission(null, 'MANAGE_COMMISSIONS')")
    public ResponseEntity<List<CommissionRuleDTO>> getRules(@RequestParam(required = false) String type) {
        List<CommissionRuleDTO> rules = ruleService.getAllActiveRules();
        return ResponseEntity.ok(rules);
    }

    @PostMapping("/commissions/rules/{ruleId}/deactivate")
    @PreAuthorize("hasPermission(null, 'MANAGE_COMMISSIONS')")
    public ResponseEntity<Void> deactivateRule(@PathVariable UUID ruleId) {
        ruleService.deactivateRule(ruleId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/orders/{orderId}/status")
    @PreAuthorize("hasPermission(null, 'MANAGE_ORDER_STATUS')")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody UpdateOrderStatusRequest request) {
        orderService.updateStatus(orderId, request.status().name());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/commissions/payment-requests/{requestId}/messages")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_VENDOR_PAYOUTS') or hasPermission(null, 'REVIEW_COMMISSION_PAYMENTS')")
    public ResponseEntity<CommissionPaymentRequestDTO> addPaymentRequestMessage(
            @PathVariable UUID requestId,
            @RequestBody PaymentRequestMessageRequest request) {
        return ResponseEntity.ok(paymentService.addPlatformMessage(requestId, request.message()));
    }

    @PostMapping("/orders/{orderId}/vendors/{supplierId}/invalidate")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_ORDERS')")
    public ResponseEntity<Void> invalidateVendorPortion(@PathVariable UUID orderId, @PathVariable UUID supplierId,
            @RequestBody InvalidateVendorPortionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        orderService.invalidateVendorPortion(orderId, supplierId, principal.getUserId(),
                request.reason(), request.details());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/orders/assistance-requests")
    @PreAuthorize("hasPermission(null, 'REVIEW_ORDER_ASSISTANCE')")
    public ResponseEntity<List<OrderAssistanceRequestDTO>> getAssistanceRequests(
            @RequestParam(required = false) String status) {
        List<OrderAssistanceRequestDTO> requests;
        if (status != null && !status.isBlank()) {
            requests = assistanceService.getRequestsByStatus(AssistanceStatus.valueOf(status.toUpperCase()));
        } else {
            requests = assistanceService.getAllRequests();
        }
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/orders/assistance-requests/{requestId}/resolve")
    @PreAuthorize("hasPermission(null, 'REVIEW_ORDER_ASSISTANCE')")
    public ResponseEntity<Void> resolveAssistanceRequest(
            @PathVariable UUID requestId,
            @RequestBody ResolveAssistanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        assistanceService.resolveRequest(requestId, principal.getUserId(), request.resolution());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/orders/assistance-requests/{requestId}/message")
    @PreAuthorize("hasPermission(null, 'REVIEW_ORDER_ASSISTANCE')")
    public ResponseEntity<OrderAssistanceRequestDTO> addAssistanceMessage(
            @PathVariable UUID requestId,
            @RequestBody AssistanceMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderAssistanceRequestDTO updated = assistanceService.addAdminMessage(requestId, principal.getUserId(), request.message());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/orders/assistance-requests/{requestId}/close")
    @PreAuthorize("hasPermission(null, 'REVIEW_ORDER_ASSISTANCE')")
    public ResponseEntity<Void> closeAssistanceRequest(@PathVariable UUID requestId) {
        assistanceService.closeRequest(requestId);
        return ResponseEntity.noContent().build();
    }
}

package com.giftastic.giftastic.modules.commission.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.commission.domain.CommissionPaymentRequest;
import com.giftastic.giftastic.modules.commission.domain.PaymentRequestStatus;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;

public record CommissionPaymentRequestDTO(
    UUID id,
    UUID commissionId,
    UUID orderId,
    UUID supplierId,
    UUID vendorUserId,
    String supplierName,
    UUID customerId,
    String customerName,
    String customerEmail,
    OrderStatus orderStatus,
    String paymentMethod,
    BigDecimal payableAmount,
    CommissionDirection direction,
    String senderLabel,
    String receiverLabel,
    String message,
    String proofImageUrl,
    List<CommissionPaymentMessageDTO> messages,
    PaymentRequestStatus status,
    LocalDateTime submittedAt,
    LocalDateTime reviewedAt,
    UUID reviewedBy,
    String rejectionReason
) {
    public static CommissionPaymentRequestDTO from(CommissionPaymentRequest request, String supplierName) {
        return from(request, supplierName, null, null, null);
    }

    public static CommissionPaymentRequestDTO from(CommissionPaymentRequest request, String supplierName, Commission commission) {
        return from(request, supplierName, commission, null, null);
    }

    public static CommissionPaymentRequestDTO from(CommissionPaymentRequest request, String supplierName,
                                                   Commission commission, Order order, UUID vendorUserId) {
        return from(request, supplierName, commission, order, vendorUserId,
                request.getMessages().stream().map(CommissionPaymentMessageDTO::from).toList());
    }

    public static CommissionPaymentRequestDTO from(CommissionPaymentRequest request, String supplierName,
                                                   Commission commission, Order order, UUID vendorUserId,
                                                   List<CommissionPaymentMessageDTO> messages) {
        CommissionDirection direction = commission == null ? null : commission.effectiveDirection();
        return new CommissionPaymentRequestDTO(
            request.getId(),
            request.getCommissionId(),
            commission == null ? null : commission.getOrderId(),
            request.getSupplierId(),
            vendorUserId,
            supplierName,
            order == null ? null : order.getCustomerId(),
            order == null ? null : order.getCustomerName(),
            order == null ? null : order.getCustomerEmail(),
            order == null ? null : order.getStatus(),
            order == null ? null : order.getPaymentMethod(),
            commission == null ? null : commission.getPayableAmount(),
            direction,
            direction == CommissionDirection.PLATFORM_TO_VENDOR ? "Giftastic" : supplierName,
            direction == CommissionDirection.PLATFORM_TO_VENDOR ? supplierName : "Giftastic",
            request.getMessage(),
            request.getProofImageUrl(),
            messages,
            request.getStatus(),
            request.getSubmittedAt(),
            request.getReviewedAt(),
            request.getReviewedBy(),
            request.getRejectionReason()
        );
    }
}

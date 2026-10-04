package com.giftastic.giftastic.modules.commission.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.commission.domain.AssistanceStatus;
import com.giftastic.giftastic.modules.commission.domain.AssistanceSenderRole;
import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceMessage;
import com.giftastic.giftastic.modules.commission.domain.OrderAssistanceRequest;
import com.giftastic.giftastic.modules.commission.dto.OrderAssistanceMessageDTO;
import com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO;
import com.giftastic.giftastic.modules.commission.repository.OrderAssistanceMessageRepository;
import com.giftastic.giftastic.modules.commission.repository.OrderAssistanceRequestRepository;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service("commissionOrderAssistanceService")
@RequiredArgsConstructor
public class OrderAssistanceService {

    private final OrderAssistanceRequestRepository assistanceRepository;
    private final OrderAssistanceMessageRepository messageRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderAssistanceRequestDTO requestAssistance(UUID orderId, UUID supplierId, String message) {
        OrderAssistanceRequest request = OrderAssistanceRequest.create(orderId, supplierId, message);
        assistanceRepository.save(request);

        OrderAssistanceMessage initialMessage = OrderAssistanceMessage.create(
                request.getId(), supplierId, AssistanceSenderRole.VENDOR, message);
        messageRepository.save(initialMessage);

        return OrderAssistanceRequestDTO.from(request, getVendorName(supplierId), getMessages(request.getId()));
    }

    public List<OrderAssistanceRequestDTO> getPendingRequests() {
        return getRequestsByStatus(AssistanceStatus.PENDING);
    }

    public List<OrderAssistanceRequestDTO> getRequestsByStatus(AssistanceStatus status) {
        List<OrderAssistanceRequest> requests = assistanceRepository.findByStatusOrderByRequestedAtAsc(status);
        return mapRequests(requests);
    }

    public List<OrderAssistanceRequestDTO> getAllRequests() {
        return mapRequests(assistanceRepository.findAll());
    }

    public List<OrderAssistanceRequestDTO> getVendorRequests(UUID supplierId) {
        List<OrderAssistanceRequest> requests = assistanceRepository.findBySupplierIdOrderByRequestedAtDesc(supplierId);
        return mapRequests(requests);
    }

    public List<OrderAssistanceRequestDTO> getOrderRequests(UUID orderId) {
        List<OrderAssistanceRequest> requests = assistanceRepository.findByOrderId(orderId);
        return mapRequests(requests);
    }

    @Transactional
    public void markInProgress(UUID requestId) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));
        request.markInProgress();
        assistanceRepository.save(request);
    }

    @Transactional
    public void resolveRequest(UUID requestId, UUID adminId, String resolution) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));

        request.resolve(adminId, resolution);
        assistanceRepository.save(request);

        OrderAssistanceMessage response = OrderAssistanceMessage.create(
            requestId, adminId, AssistanceSenderRole.ADMIN, resolution);
        messageRepository.save(response);

        notificationService.sendNotification(
                request.getSupplierId(),
                "Order Assistance Request Updated",
                "Your assistance request for order #" + request.getOrderId() + " has been resolved: " + resolution,
                com.giftastic.giftastic.modules.notification.domain.NotificationType.VENDOR_ALERT,
                "{\"requestId\":\"" + requestId + "\",\"orderId\":\"" + request.getOrderId() + "\",\"resolution\":\"" + resolution.replace("\"", "\\\"") + "\"}"
        );
    }

    @Transactional
    public void closeRequest(UUID requestId) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));
        request.close();
        assistanceRepository.save(request);
    }

    @Transactional
    public OrderAssistanceRequestDTO addAdminMessage(UUID requestId, UUID adminId, String message) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));

        if (request.getStatus() == AssistanceStatus.CLOSED) {
            throw new IllegalStateException("Cannot add messages to a closed request");
        }

        if (request.getStatus() == AssistanceStatus.PENDING) {
            request.markInProgress();
        }

        assistanceRepository.save(request);

        OrderAssistanceMessage adminMessage = OrderAssistanceMessage.create(
                requestId, adminId, AssistanceSenderRole.ADMIN, message);
        messageRepository.save(adminMessage);

        return OrderAssistanceRequestDTO.from(request, getVendorName(request.getSupplierId()), getMessages(requestId));
    }

    @Transactional
    public OrderAssistanceRequestDTO addVendorMessage(UUID requestId, UUID supplierId, String message) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));

        if (!request.getSupplierId().equals(supplierId)) {
            throw new IllegalStateException("Cannot reply to another vendor's request");
        }

        if (request.getStatus() == AssistanceStatus.CLOSED) {
            throw new IllegalStateException("Cannot add messages to a closed request");
        }

        if (request.getStatus() == AssistanceStatus.RESOLVED) {
            request.reopen();
        }

        assistanceRepository.save(request);

        OrderAssistanceMessage vendorMessage = OrderAssistanceMessage.create(
                requestId, supplierId, AssistanceSenderRole.VENDOR, message);
        messageRepository.save(vendorMessage);

        return OrderAssistanceRequestDTO.from(request, getVendorName(supplierId), getMessages(requestId));
    }

    @Transactional
    public OrderAssistanceRequestDTO confirmResolution(UUID requestId, UUID supplierId, boolean resolved, String message) {
        OrderAssistanceRequest request = assistanceRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found"));

        if (!request.getSupplierId().equals(supplierId)) {
            throw new IllegalStateException("Cannot update another vendor's request");
        }

        if (request.getStatus() == AssistanceStatus.CLOSED) {
            throw new IllegalStateException("Request already closed");
        }

        if (resolved) {
            request.close();
        } else if (request.getStatus() == AssistanceStatus.RESOLVED) {
            request.reopen();
        }

        assistanceRepository.save(request);

        if (message != null && !message.trim().isEmpty()) {
            OrderAssistanceMessage vendorMessage = OrderAssistanceMessage.create(
                    requestId, supplierId, AssistanceSenderRole.VENDOR, message);
            messageRepository.save(vendorMessage);
        }

        return OrderAssistanceRequestDTO.from(request, getVendorName(supplierId), getMessages(requestId));
    }

    private List<OrderAssistanceRequestDTO> mapRequests(List<OrderAssistanceRequest> requests) {
        return requests.stream()
                .map(r -> OrderAssistanceRequestDTO.from(r, getVendorName(r.getSupplierId()), getMessages(r.getId())))
                .collect(Collectors.toList());
    }

    private List<OrderAssistanceMessageDTO> getMessages(UUID requestId) {
        return messageRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .map(OrderAssistanceMessageDTO::from)
                .collect(Collectors.toList());
    }

    private String getVendorName(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(v -> v.getStoreName())
                .orElse("Unknown Vendor");
    }
}

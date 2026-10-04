package com.giftastic.giftastic.modules.order.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.dto.GuestCheckoutRequest;
import com.giftastic.giftastic.modules.order.dto.GuestInstapayTransactionIdsRequest;
import com.giftastic.giftastic.modules.order.dto.ChangePaymentMethodRequest;
import com.giftastic.giftastic.modules.order.dto.InstapayTransactionIdsRequest;
import com.giftastic.giftastic.modules.order.dto.RejectOrderPaymentRequest;
import com.giftastic.giftastic.modules.order.dto.UpdateVendorOrderStatusRequest;
import com.giftastic.giftastic.modules.order.dto.VendorOrderResponse;
import com.giftastic.giftastic.modules.order.service.OrderService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class OrderController {

    private final OrderService orderService;
    private final com.giftastic.giftastic.modules.order.service.DeliveryNotificationService deliveryNotificationService;
    private final com.giftastic.giftastic.modules.commission.service.OrderAssistanceService assistanceService;

    @PostMapping
    @PreAuthorize("hasPermission(#request.customerId, 'USER_OWNER')")
    public ResponseEntity<Order> placeOrder(@RequestBody com.giftastic.giftastic.modules.order.dto.PlaceOrderRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(
            request.getCustomerId(), 
            request.getCustomerName(),
            request.getCustomerEmail(),
            request.getItems(),
            request.getShippingAddress(),
            request.getPaymentMethod(),
            request.getInstapayPhoneNumber(),
            request.getInstapayRefundPhoneNumber(),
            request.getInstapayRefundName(),
            request.getDeliveryZoneId()
        ));
    }

    @PostMapping("/guest-checkout")
    public ResponseEntity<Order> placeGuestOrder(@RequestBody GuestCheckoutRequest request) {
        return ResponseEntity.ok(orderService.placeGuestOrder(
            request.guestInfo(), 
            request.items(), 
            request.paymentMethod(), 
            request.instapayPhoneNumber(),
            request.instapayRefundPhoneNumber(),
            request.instapayRefundName(),
            request.deliveryZoneId()
        ));
    }

    @GetMapping("/guest-track/{orderId}")
    public ResponseEntity<Order> trackGuestOrder(@PathVariable UUID orderId,
            @RequestParam String email,
            @RequestParam String phone) {
        return ResponseEntity.ok(orderService.getGuestOrder(orderId, email, phone));
    }

    @PostMapping("/guest-track/{orderId}/instapay-transactions")
    public ResponseEntity<Void> submitGuestInstapayTransactions(@PathVariable UUID orderId,
            @RequestBody GuestInstapayTransactionIdsRequest request) {
        orderService.submitGuestInstapayTransactionIds(orderId, request.email(), request.phone(), request.transactionIds());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'VIEW_ORDERS') or hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Page<Order>> getCustomerOrders(
            @PathVariable UUID customerId,
            Pageable pageable) {
        return ResponseEntity.ok(orderService.getCustomerOrders(customerId, pageable));
    }

    @GetMapping("/vendor")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Page<VendorOrderResponse>> getVendorOrders(Pageable pageable) {
        UUID supplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (supplierId == null) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(orderService.getVendorOrderResponses(supplierId, pageable));
    }

    @PatchMapping("/{orderId}/payment-method")
    @PreAuthorize("hasPermission(#request.customerId, 'USER_OWNER')")
    public ResponseEntity<Void> changePaymentMethod(@PathVariable UUID orderId,
            @RequestBody ChangePaymentMethodRequest request) {
        orderService.changePaymentMethod(orderId, request.customerId(), request.paymentMethod(), request.instapayPhoneNumber(),
                request.instapayRefundPhoneNumber(), request.instapayRefundName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{orderId}/instapay-transactions")
    @PreAuthorize("hasPermission(#request.customerId, 'USER_OWNER')")
    public ResponseEntity<Void> submitInstapayTransactions(@PathVariable UUID orderId,
            @RequestBody InstapayTransactionIdsRequest request) {
        orderService.submitInstapayTransactionIds(orderId, request.customerId(), request.transactionIds());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pending-confirmation")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'CONFIRM_ORDER_PAYMENTS')")
    public ResponseEntity<Page<Order>> getPendingConfirmationOrders(Pageable pageable) {
        return ResponseEntity.ok(orderService.getPendingConfirmationOrders(pageable));
    }

    @PatchMapping("/{orderId}/confirm-payment")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'CONFIRM_ORDER_PAYMENTS')")
    public ResponseEntity<Void> confirmPayment(@PathVariable UUID orderId) {
        orderService.confirmInstapayPayment(orderId,
                com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderId}/reject-payment")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'CONFIRM_ORDER_PAYMENTS')")
    public ResponseEntity<Void> rejectPayment(@PathVariable UUID orderId,
            @RequestBody RejectOrderPaymentRequest request) {
        orderService.rejectInstapayPayment(orderId, request.reason());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderId}/vendor-status")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> updateVendorStatus(@PathVariable UUID orderId,
            @RequestBody UpdateVendorOrderStatusRequest request) {
        UUID supplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (supplierId == null) return ResponseEntity.status(403).build();
        orderService.updateVendorStatus(orderId, supplierId, request.status());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{orderId}")
    @org.springframework.security.access.prepost.PostAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'VIEW_ORDERS') or hasPermission(returnObject.body.customerId, 'ORDER_OWNER')")
    public ResponseEntity<Order> getOrderById(@PathVariable UUID orderId) {
        Order order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    /**
     * Admin action to view all orders across the system.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'VIEW_ORDERS')")
    public ResponseEntity<Page<Order>> getAllOrders(Pageable pageable) {
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    // Admin
    @PatchMapping("/{orderId}/pay")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_ORDERS')")
    public ResponseEntity<Void> markAsPaid(@PathVariable UUID orderId) {
        orderService.processPayment(orderId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderId}/status")
    @org.springframework.security.access.prepost.PostAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(null, 'MANAGE_ORDERS') or hasPermission(@orderService.getOrderSecurity(#orderId), 'VENDOR_ORDER_OWNER')")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam String status) {
        orderService.updateStatus(orderId, status);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Order> checkoutCart(@RequestParam UUID customerId) {
        return ResponseEntity.ok(orderService.checkoutCart(customerId));
    }

    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasPermission(#customerId, 'USER_OWNER')")
    public ResponseEntity<Void> cancelOrder(
            @PathVariable UUID orderId,
            @RequestParam UUID customerId) {
        Order order = orderService.getOrderById(orderId);
        if (!order.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(403).build();
        }
        orderService.cancelOrder(orderId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Vendor Action: Update delivery estimate for an order
     */
    @PostMapping("/{orderId}/delivery-estimate")
    @org.springframework.security.access.prepost.PostAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(@orderService.getOrderSecurity(#orderId), 'VENDOR_ORDER_OWNER')")
    public ResponseEntity<Void> updateDeliveryEstimate(
            @PathVariable UUID orderId,
            @RequestBody com.giftastic.giftastic.modules.order.dto.UpdateDeliveryEstimateRequest request) {
        deliveryNotificationService.updateDeliveryEstimate(
            orderId, 
            request.estimatedDeliveryDate(), 
            request.notes()
        );
        return ResponseEntity.ok().build();
    }
    
    /**
     * Vendor Action: Notify customer of delivery delay
     */
    @PostMapping("/{orderId}/notify-delay")
    @org.springframework.security.access.prepost.PostAuthorize("hasAuthority('SUPER_ADMIN') or hasPermission(@orderService.getOrderSecurity(#orderId), 'VENDOR_ORDER_OWNER')")
    public ResponseEntity<Void> notifyDeliveryDelay(
            @PathVariable UUID orderId,
            @RequestBody com.giftastic.giftastic.modules.order.dto.NotifyDelayRequest request) {
        deliveryNotificationService.notifyDeliveryDelay(
            orderId, 
            request.reason(), 
            request.newEstimatedDate()
        );
        return ResponseEntity.ok().build();
    }
    
    /**
     * Vendor Action: Request assistance from admin for an order
     */
    @PostMapping("/{orderId}/request-assistance")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO> requestAssistance(
            @PathVariable UUID orderId,
            @RequestBody com.giftastic.giftastic.modules.commission.dto.RequestAssistanceRequest request) {
        UUID supplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (supplierId == null) {
            return ResponseEntity.status(403).build();
        }
        
        com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO assistanceRequest = 
            assistanceService.requestAssistance(orderId, supplierId, request.message());
        return ResponseEntity.ok(assistanceRequest);
    }
    
    /**
     * Vendor Action: Get all assistance requests for current vendor
     */
    @GetMapping("/assistance/my-requests")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO>> getMyAssistanceRequests() {
        UUID supplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (supplierId == null) {
            return ResponseEntity.status(403).build();
        }
        
        List<com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO> requests = 
            assistanceService.getVendorRequests(supplierId);
        return ResponseEntity.ok(requests);
    }
    
    /**
     * Admin Action: Get pending assistance requests
     */
    @GetMapping("/assistance/pending")
    @PreAuthorize("hasPermission(null, 'MANAGE_ORDERS')")
    public ResponseEntity<List<com.giftastic.giftastic.modules.commission.dto.OrderAssistanceRequestDTO>> getPendingAssistanceRequests() {
        return ResponseEntity.ok(assistanceService.getPendingRequests());
    }
    
    /**
     * Admin Action: Mark assistance request as in progress
     */
    @PatchMapping("/assistance/{requestId}/in-progress")
    @PreAuthorize("hasPermission(null, 'MANAGE_ORDERS')")
    public ResponseEntity<Void> markAssistanceInProgress(@PathVariable UUID requestId) {
        assistanceService.markInProgress(requestId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Admin Action: Resolve assistance request
     */
    @PostMapping("/assistance/{requestId}/resolve")
    @PreAuthorize("hasPermission(null, 'MANAGE_ORDERS')")
    public ResponseEntity<Void> resolveAssistanceRequest(
            @PathVariable UUID requestId,
            @RequestBody com.giftastic.giftastic.modules.commission.dto.ResolveAssistanceRequest request) {
        UUID adminId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentUserId();
        assistanceService.resolveRequest(requestId, adminId, request.resolution());
        return ResponseEntity.noContent().build();
    }
}

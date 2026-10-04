package com.giftastic.giftastic.modules.order.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.giftastic.giftastic.modules.order.domain.GuestInfo;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;
import com.giftastic.giftastic.modules.order.dto.VendorOrderResponse;

import jakarta.transaction.Transactional;

public interface OrderService {
    Order placeOrder(UUID customerId, String customerName, String customerEmail, List<OrderItem> items, String shippingAddress, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, UUID deliveryZoneId);
    Order placeGuestOrder(GuestInfo guestInfo, List<OrderItem> items, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, UUID deliveryZoneId);
    
    @Transactional
    Order checkoutCart(UUID customerId);

    @Transactional
    void cancelOrder(UUID orderId);

    void processPayment(UUID orderId);

    @Transactional
    void shipOrder(UUID orderId);

    void updateStatus(UUID orderId, String status);
    void changePaymentMethod(UUID orderId, UUID customerId, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName);
    void submitInstapayTransactionIds(UUID orderId, UUID customerId, List<String> transactionIds);
    void submitGuestInstapayTransactionIds(UUID orderId, String email, String phone, List<String> transactionIds);
    void confirmInstapayPayment(UUID orderId, UUID adminId);
    void rejectInstapayPayment(UUID orderId, String reason);
    void updateVendorStatus(UUID orderId, UUID supplierId, VendorOrderStatus status);
    void invalidateVendorPortion(UUID orderId, UUID supplierId, UUID invalidatedBy, String reason, String details);
    
    Order getOrderById(UUID orderId);
    Order getGuestOrder(UUID orderId, String email, String phone);
    
    /**
     * Get order security information for authorization checks.
     * Returns the order ID, customer ID, and all supplier IDs of products in the order.
     */
    com.giftastic.giftastic.common.dto.OrderSecurityDTO getOrderSecurity(UUID orderId);
    
    Page<Order> getCustomerOrders(UUID customerId, Pageable pageable);
    Page<Order> getVendorOrders(UUID supplierId, Pageable pageable);
    Page<VendorOrderResponse> getVendorOrderResponses(UUID supplierId, Pageable pageable);
    Page<Order> getAllOrders(Pageable pageable);
    Page<Order> getPendingConfirmationOrders(Pageable pageable);
}

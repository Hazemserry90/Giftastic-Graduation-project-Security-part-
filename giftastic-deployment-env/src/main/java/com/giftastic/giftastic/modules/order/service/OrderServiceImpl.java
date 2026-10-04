package com.giftastic.giftastic.modules.order.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.common.exception.OrderNotFoundException;
import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.cart.dto.CartResponse;
import com.giftastic.giftastic.modules.cart.service.CartService;
import com.giftastic.giftastic.modules.delivery.service.DeliveryService;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.order.domain.GuestInfo;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;
import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;
import com.giftastic.giftastic.modules.order.dto.VendorOrderResponse;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.product.service.ProductService;
import com.giftastic.giftastic.modules.user.domain.Address;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.service.UserService;
import com.giftastic.giftastic.modules.vendor.domain.VendorActivityType;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;
import com.giftastic.giftastic.modules.vendor.service.VendorActivityService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final CartService cartService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final DeliveryService deliveryService;
    private final VendorActivityService vendorActivityService;
    private final com.giftastic.giftastic.modules.commission.service.CommissionService commissionService;
    private final com.giftastic.giftastic.common.config.PaymentConfig paymentConfig;
    private final com.giftastic.giftastic.common.config.OrderFlowConfig orderFlowConfig;
    private final com.giftastic.giftastic.modules.commission.service.CommissionPricingService commissionPricingService;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public Order placeOrder(UUID customerId, String customerName, String customerEmail, List<OrderItem> items, String shippingAddress, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, UUID deliveryZoneId) {
        log.info("Process: placeOrder received for {} items from customer {}", items.size(), customerId);
        instapayPhoneNumber = "INSTAPAY".equalsIgnoreCase(paymentMethod)
                ? paymentConfig.getInstapay().getPhoneNumber() : null;
        
        if (customerId != null) {
            try {
                User user = userService.getById(customerId);
                if (customerName == null || customerName.isBlank()) {
                    customerName = user.getFullName() != null ? user.getFullName() : user.getEmail();
                }
                if (customerEmail == null || customerEmail.isBlank()) {
                    customerEmail = user.getEmail();
                }
                if ("INSTAPAY".equalsIgnoreCase(paymentMethod)) {
                    instapayRefundPhoneNumber = firstPresent(instapayRefundPhoneNumber, user.getInstapayRefundPhoneNumber());
                    instapayRefundName = firstPresent(instapayRefundName, user.getInstapayRefundName());
                    InstapayRefundDetails refundDetails = requireInstapayRefundDetails(instapayRefundPhoneNumber, instapayRefundName);
                    instapayRefundPhoneNumber = refundDetails.phoneNumber();
                    instapayRefundName = refundDetails.name();
                    userService.updateInstapayRefundDetails(customerId, instapayRefundPhoneNumber, instapayRefundName);
                }
                if (shippingAddress == null || shippingAddress.isBlank()) {
                    shippingAddress = user.getAddresses().stream()
                        .filter(Address::isDefault)
                        .findFirst()
                        .map(a -> a.getStreet() + ", " + a.getCity() + ", " + a.getState())
                        .orElseGet(() -> user.getAddresses().isEmpty() ? null : 
                            user.getAddresses().get(0).getStreet() + ", " + user.getAddresses().get(0).getCity() + ", " + user.getAddresses().get(0).getState());
                }
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Could not fetch customer details for order: {}", e.getMessage());
            }
        }
        
        if (customerName == null) customerName = "Guest Customer";
        if (customerEmail == null) customerEmail = "guest@example.com";

        java.time.LocalDateTime pricingAt = java.time.LocalDateTime.now();
        java.util.Map<UUID, java.math.BigDecimal> commissionRates = new java.util.HashMap<>();
        List<OrderItem> enrichedItems = items.stream()
                .map(item -> createPricedOrderItem(item, pricingAt, commissionRates)).collect(Collectors.toList());

        // Use delivery zone from request, but recalculate costs on backend for security
        java.math.BigDecimal totalDeliveryCost = java.math.BigDecimal.ZERO;
        String deliveryCostBreakdownJson = null;
        
        if (deliveryZoneId != null) {
            // Group items by vendor and calculate delivery cost per vendor
            java.util.Map<UUID, java.math.BigDecimal> breakdown = new java.util.HashMap<>();
            
            enrichedItems.stream()
                .map(OrderItem::getSupplierId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .forEach(supplierId -> {
                    java.math.BigDecimal cost = deliveryService.getDeliveryCost(supplierId, deliveryZoneId);
                    breakdown.put(supplierId, cost);
                    log.info("Vendor {} delivery cost for zone {}: {}", supplierId, deliveryZoneId, cost);
                });
            
            // Calculate total delivery cost
            totalDeliveryCost = breakdown.values().stream()
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            
            // Convert breakdown to JSON string
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                deliveryCostBreakdownJson = mapper.writeValueAsString(breakdown);
            } catch (Exception e) {
                log.warn("Failed to serialize delivery cost breakdown: {}", e.getMessage());
            }
            
            log.info("Total delivery cost calculated: {} for {} vendors", totalDeliveryCost, breakdown.size());
        }
        
        Order order = Order.place(customerId, customerName, customerEmail, enrichedItems, shippingAddress, paymentMethod,
                instapayPhoneNumber, instapayRefundPhoneNumber, instapayRefundName,
                orderFlowConfig.getCancelGracePeriodMinutes(), deliveryZoneId, totalDeliveryCost, deliveryCostBreakdownJson);
        order.snapshotCommissionRates(commissionRates, pricingAt);
        Order savedOrder = orderRepository.save(order);
        notifyVendorsOrderPlaced(savedOrder);
        
        // Notify Customer
        notificationService.sendNotification(
            customerId,
            "Order Placed!",
            "Your order #" + savedOrder.getId().toString().substring(0, 8) + " has been placed successfully.",
            NotificationType.ORDER_STATUS_UPDATE,
            "{\"orderId\":\"" + savedOrder.getId() + "\"}"
        );
        
        log.info("Completed: placeOrder persisted order ID {}", savedOrder.getId());
        return savedOrder;
    }

    @Override
    @Transactional
    public Order placeGuestOrder(GuestInfo guestInfo, List<OrderItem> items, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, UUID deliveryZoneId) {
        instapayPhoneNumber = "INSTAPAY".equalsIgnoreCase(paymentMethod)
                ? paymentConfig.getInstapay().getPhoneNumber() : null;
        if ("INSTAPAY".equalsIgnoreCase(paymentMethod)) {
            InstapayRefundDetails refundDetails = requireInstapayRefundDetails(instapayRefundPhoneNumber, instapayRefundName);
            instapayRefundPhoneNumber = refundDetails.phoneNumber();
            instapayRefundName = refundDetails.name();
        }
        java.time.LocalDateTime pricingAt = java.time.LocalDateTime.now();
        java.util.Map<UUID, java.math.BigDecimal> commissionRates = new java.util.HashMap<>();
        List<OrderItem> enrichedItems = items.stream()
                .map(item -> createPricedOrderItem(item, pricingAt, commissionRates)).collect(Collectors.toList());
        
        // Use delivery zone from request, but recalculate costs on backend for security
        java.math.BigDecimal totalDeliveryCost = java.math.BigDecimal.ZERO;
        String deliveryCostBreakdownJson = null;
        
        if (deliveryZoneId != null) {
            // Group items by vendor and calculate delivery cost per vendor
            java.util.Map<UUID, java.math.BigDecimal> breakdown = new java.util.HashMap<>();
            
            enrichedItems.stream()
                .map(OrderItem::getSupplierId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .forEach(supplierId -> {
                    java.math.BigDecimal cost = deliveryService.getDeliveryCost(supplierId, deliveryZoneId);
                    breakdown.put(supplierId, cost);
                });
            
            // Calculate total delivery cost
            totalDeliveryCost = breakdown.values().stream()
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            
            // Convert breakdown to JSON string
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                deliveryCostBreakdownJson = mapper.writeValueAsString(breakdown);
            } catch (Exception e) {
                log.warn("Failed to serialize delivery cost breakdown: {}", e.getMessage());
            }
        }
        
        Order order = Order.placeAsGuest(guestInfo, enrichedItems, paymentMethod, instapayPhoneNumber,
                instapayRefundPhoneNumber, instapayRefundName,
                orderFlowConfig.getCancelGracePeriodMinutes(), deliveryZoneId, totalDeliveryCost, deliveryCostBreakdownJson);
        order.snapshotCommissionRates(commissionRates, pricingAt);
        Order savedOrder = orderRepository.save(order);
        notifyVendorsOrderPlaced(savedOrder);
        
        return savedOrder;
    }

    @Override
    @Transactional
    public Order checkoutCart(UUID customerId) {
        CartResponse cart = cartService.getCart(customerId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }
        
        List<OrderItem> orderItems = cart.getItems().stream().map(cartItem -> {
            return new OrderItem(
                cartItem.getProductId(), 
                null, // productName will be enriched in placeOrder
                null, // imageUrl will be enriched in placeOrder
                cartItem.getQuantity(), 
                java.math.BigDecimal.valueOf(cartItem.getPrice()),
                cartItem.getSupplierId(), // Include supplierId from cart
                cartItem.getGroupId(), 
                cartItem.getMetadata()
            );
        }).collect(Collectors.toList());
        
        Order order = placeOrder(customerId, null, null, orderItems, null, "COD", null, null, null, null);
        cartService.clearCart(customerId);
        return order;
    }

    @Override
    @Transactional
    public void cancelOrder(UUID orderId) {
        Order order = getOrThrow(orderId);
        
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean isAdmin = SecurityUtils.hasAuthority("SUPER_ADMIN") || SecurityUtils.hasAuthority("MANAGE_ORDERS");
        
        if (!isAdmin && order.getCustomerId() != null && !order.getCustomerId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot cancel another user's order");
        }
        
        order.cancel(java.time.LocalDateTime.now());
        orderRepository.delete(order);
        
        if (order.getCustomerId() != null) {
            notificationService.sendNotification(
                order.getCustomerId(),
                "Order Cancelled",
                "Your order #" + orderId.toString().substring(0, 8) + " has been cancelled.",
                NotificationType.ORDER_STATUS_UPDATE,
                "{\"orderId\":\"" + orderId + "\"}"
            );
        }
    }

    @Override
    @Transactional
    public void processPayment(UUID orderId) {
        log.info("Processing payment for order: {}", orderId);
        Order order = getOrThrow(orderId);
        order.markAsPaid();
        orderRepository.save(order);
        
        log.info("Order {} marked as PAID, creating commissions", orderId);
        commissionService.createCommissionsForOrder(order);
        log.info("Commissions created for order {}", orderId);
    }

    @Transactional
    @Override
    public void shipOrder(UUID orderId) {
        Order order = getOrThrow(orderId);
        order.markAsShipped();
        orderRepository.save(order);
        
        // Log vendor activity
        order.getItems().stream()
            .map(item -> productService.getOrThrow(item.getProductId()))
            .map(Product::getSupplierId)
            .distinct()
            .forEach(supplierId -> {
                vendorActivityService.logActivity(
                    supplierId,
                    VendorActivityType.ORDER_SHIPPED,
                    "Order shipped: #" + orderId.toString().substring(0, 8),
                    orderId,
                    null
                );
            });
        
        if (order.getCustomerId() != null) {
            notificationService.sendNotification(
                order.getCustomerId(),
                "Order Shipped!",
                "Great news! Your order #" + orderId.toString().substring(0, 8) + " is on its way.",
                NotificationType.ORDER_STATUS_UPDATE,
                "{\"orderId\":\"" + orderId + "\"}"
            );
        }
    }

    @Override
    @Transactional
    public void updateStatus(UUID orderId, String status) {
        Order order = getOrThrow(orderId);
        
        try {
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            OrderStatus oldStatus = order.getStatus();

            if (newStatus == OrderStatus.INVALID && !order.getVendorStatuses().isEmpty()) {
                throw new IllegalStateException("Invalidate vendor portions individually with reason and details");
            }

            if (SecurityUtils.hasAuthority("ROLE_VENDOR") && !isVendorForwardTransition(oldStatus, newStatus)) {
                throw new IllegalStateException("Vendors can only move orders forward in the status flow");
            }

            ensureInstapayVendorFlowIsNotBypassed(order, oldStatus, newStatus);
            
            boolean releasesPendingOrder = oldStatus == OrderStatus.PENDING_CONFIRMATION
                    && (newStatus == OrderStatus.IN_PROGRESS
                    || newStatus == OrderStatus.OUT_FOR_DELIVERY
                    || newStatus == OrderStatus.DONE);
            order.synchronizeVendorStatusesForAggregateStatus(
                    newStatus,
                    java.time.LocalDateTime.now(),
                    orderFlowConfig.getCustomerProblemWindowMinutes());
            if (releasesPendingOrder) {
                deductStockForReleasedOrder(order);
                notifyVendorsOrderReleased(order);
            }
            orderRepository.save(order);
            
            // If order is being marked as PAID, create commissions
            if (newStatus == OrderStatus.PAID && oldStatus != OrderStatus.PAID) {
                log.info("Order {} status changed to PAID, creating commissions", orderId);
                commissionService.createCommissionsForOrder(order);
            }
            
            if (order.getCustomerId() != null) {
                notificationService.sendNotification(
                    order.getCustomerId(),
                    "Order Status Update",
                    "Your order #" + orderId.toString().substring(0, 8) + " status is now: " + status,
                    NotificationType.ORDER_STATUS_UPDATE,
                    "{\"orderId\":\"" + orderId + "\"}"
                );
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + status);
        }
    }

    @Override
    @Transactional
    public void changePaymentMethod(UUID orderId, UUID customerId, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName) {
        Order order = getOrThrow(orderId);
        if (order.getCustomerId() == null || !order.getCustomerId().equals(customerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot change another customer's payment method");
        }
        String configuredPhone = "INSTAPAY".equalsIgnoreCase(paymentMethod)
                ? paymentConfig.getInstapay().getPhoneNumber() : null;
        if ("INSTAPAY".equalsIgnoreCase(paymentMethod)) {
            User user = userService.getById(customerId);
            instapayRefundPhoneNumber = firstPresent(instapayRefundPhoneNumber, user.getInstapayRefundPhoneNumber());
            instapayRefundName = firstPresent(instapayRefundName, user.getInstapayRefundName());
            InstapayRefundDetails refundDetails = requireInstapayRefundDetails(instapayRefundPhoneNumber, instapayRefundName);
            instapayRefundPhoneNumber = refundDetails.phoneNumber();
            instapayRefundName = refundDetails.name();
            user.updateInstapayRefundDetails(instapayRefundPhoneNumber, instapayRefundName);
        }
        order.changePaymentMethod(paymentMethod, configuredPhone, instapayRefundPhoneNumber, instapayRefundName, java.time.LocalDateTime.now());
        orderRepository.save(order);
    }

    @Override
    @Transactional
    public void submitInstapayTransactionIds(UUID orderId, UUID customerId, List<String> transactionIds) {
        Order order = getOrThrow(orderId);
        if (order.getCustomerId() == null || !order.getCustomerId().equals(customerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot update another customer's payment");
        }
        order.submitInstapayTransactionIds(transactionIds);
        orderRepository.save(order);
    }

    @Override
    @Transactional
    public void submitGuestInstapayTransactionIds(UUID orderId, String email, String phone, List<String> transactionIds) {
        Order order = getAuthorizedGuestOrder(orderId, email, phone);
        order.submitInstapayTransactionIds(transactionIds);
        orderRepository.save(order);
    }

    @Override
    @Transactional
    public void confirmInstapayPayment(UUID orderId, UUID adminId) {
        Order order = getOrThrow(orderId);
        order.confirmInstapayPayment(adminId);
        deductStockForReleasedOrder(order);
        orderRepository.save(order);
        notifyVendorsOrderReleased(order);
    }

    @Override
    @Transactional
    public void rejectInstapayPayment(UUID orderId, String reason) {
        Order order = getOrThrow(orderId);
        order.rejectInstapayPayment(reason);
        orderRepository.save(order);
        if (order.getCustomerId() != null) notificationService.sendNotification(
                order.getCustomerId(), "Instapay payment rejected", reason,
                NotificationType.ORDER_STATUS_UPDATE, "{\"orderId\":\"" + orderId + "\"}");
    }

    @Override
    @Transactional
    public void updateVendorStatus(UUID orderId, UUID supplierId, VendorOrderStatus status) {
        Order order = getOrThrow(orderId);
        order.updateVendorStatus(supplierId, status);
        if (status == VendorOrderStatus.DONE) {
            java.time.LocalDateTime completedAt = order.getVendorCompletedAt()
                    .getOrDefault(supplierId, java.time.LocalDateTime.now());
            order.setVendorFinancialReleaseAt(supplierId,
                    completedAt.plusMinutes(orderFlowConfig.getCustomerProblemWindowMinutes()));
        }
        orderRepository.save(order);
        if (order.getCustomerId() != null) notificationService.sendNotification(
                order.getCustomerId(), "Order vendor status updated",
                "A vendor updated your order to " + status,
                NotificationType.ORDER_STATUS_UPDATE, "{\"orderId\":\"" + orderId + "\"}");
    }

    @Override
    @Transactional
    public void invalidateVendorPortion(UUID orderId, UUID supplierId, UUID invalidatedBy, String reason, String details) {
        Order order = getOrThrow(orderId);
        if (commissionService.hasCommissionForVendorPortion(orderId, supplierId)) {
            throw new IllegalStateException("Financial flow has already started for this vendor portion");
        }
        order.invalidateVendorPortion(supplierId, invalidatedBy, reason, details, java.time.LocalDateTime.now(),
                orderFlowConfig.getCustomerProblemWindowMinutes());
        orderRepository.save(order);
        sendVendorNotification(supplierId, "Order portion invalidated",
                "Giftastic invalidated your portion of order #" + orderId.toString().substring(0, 8) + ".",
                NotificationType.VENDOR_ALERT,
                orderVendorMetadata(orderId, supplierId));
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    @Transactional
    public void releaseCodOrdersAfterPaymentWindow() {
        List<Order> pending = orderRepository.findByStatus(OrderStatus.PENDING_CONFIRMATION);
        for (Order order : pending) {
            if (order.releaseCodIfReady(java.time.LocalDateTime.now())) {
                deductStockForReleasedOrder(order);
                orderRepository.save(order);
                notifyVendorsOrderReleased(order);
            }
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    @Transactional
    public void createCommissionsForSuccessfulVendorPortions() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        orderRepository.findByStatusIn(List.of(OrderStatus.IN_PROGRESS, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DONE))
                .forEach(order -> order.getVendorStatuses().keySet().forEach(supplierId -> {
                    if (order.isVendorPortionFinanciallyEligible(supplierId, now,
                            orderFlowConfig.getCustomerProblemWindowMinutes())) {
                        commissionService.createCommissionForSuccessfulVendorPortion(order, supplierId, now);
                    }
                }));
    }

    private void deductStockForReleasedOrder(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId()).orElseThrow();
            if (!product.hasStock(item.getQuantity())) {
                throw new IllegalArgumentException(stockErrorMessage(product, item.getQuantity()));
            }
            product.decreaseStock(item.getQuantity());
            productRepository.save(product);
            vendorActivityService.logActivity(
                    product.getSupplierId(),
                    VendorActivityType.PRODUCT_STOCK_UPDATED,
                    "Stock decreased by " + item.getQuantity() + " for product: " + product.getName(),
                    product.getId(),
                    "{\"orderId\":\"" + order.getId() + "\",\"quantity\":" + item.getQuantity() + "}"
            );
            if (!product.isInStock()) {
                vendorActivityService.logActivity(
                        product.getSupplierId(),
                        VendorActivityType.PRODUCT_OUT_OF_STOCK,
                        "Product is now out of stock: " + product.getName(),
                        product.getId(),
                        null
                );
            }
        }
    }

    private void notifyVendorsOrderReleased(Order order) {
        order.getVendorStatuses().keySet().forEach(supplierId -> {
            sendVendorNotification(supplierId, "Order ready to fulfill",
                    "Order #" + order.getId().toString().substring(0, 8) + " is ready for you to manage.",
                    NotificationType.VENDOR_ALERT, orderVendorMetadata(order.getId(), supplierId));
            vendorActivityService.logActivity(supplierId, VendorActivityType.ORDER_RECEIVED,
                    "New order received: #" + order.getId().toString().substring(0, 8),
                    order.getId(), null);
        });
    }

    private void notifyVendorsOrderPlaced(Order order) {
        Map<UUID, List<OrderItem>> itemsByVendor = order.getItems().stream()
                .filter(item -> item.getSupplierId() != null)
                .collect(Collectors.groupingBy(OrderItem::getSupplierId));
        itemsByVendor.forEach((supplierId, vendorItems) -> {
            String productSummary = vendorItems.stream()
                    .map(item -> item.getProductName() != null ? item.getProductName() : "your product")
                    .distinct()
                    .limit(3)
                    .collect(Collectors.joining(", "));
            if (productSummary.isBlank()) {
                productSummary = "your product";
            }
            int itemCount = vendorItems.stream().mapToInt(OrderItem::getQuantity).sum();
            String message = "A customer placed order #" + order.getId().toString().substring(0, 8)
                    + " with " + itemCount + " item" + (itemCount == 1 ? "" : "s")
                    + " from " + productSummary + ".";
            sendVendorNotification(supplierId, "Your product was ordered", message,
                    NotificationType.VENDOR_ALERT, orderVendorMetadata(order.getId(), supplierId));
        });
    }

    private void sendVendorNotification(UUID supplierId, String title, String message,
                                        NotificationType type, String metadata) {
        if (supplierId == null) {
            log.debug("Skipping vendor notification without supplierId: {}", title);
            return;
        }
        vendorRepository.findBySupplierId(supplierId)
                .ifPresentOrElse(
                        vendor -> notificationService.sendNotification(vendor.getUserId(), title, message, type, metadata),
                        () -> log.warn("Skipping vendor notification for unknown supplierId {}", supplierId));
    }

    private static String orderVendorMetadata(UUID orderId, UUID supplierId) {
        return "{\"entityType\":\"order\",\"entityId\":\"" + orderId
                + "\",\"orderId\":\"" + orderId
                + "\",\"supplierId\":\"" + supplierId + "\"}";
    }

    private static String firstPresent(String candidate, String fallback) {
        return candidate != null && !candidate.isBlank() ? candidate : fallback;
    }

    private static InstapayRefundDetails requireInstapayRefundDetails(String phoneNumber, String name) {
        if (phoneNumber == null || phoneNumber.isBlank() || name == null || name.isBlank()) {
            throw new IllegalArgumentException("Instapay refund phone number and name are required, or choose another payment method");
        }
        String normalizedPhoneNumber = phoneNumber.trim();
        String normalizedName = name.trim().replaceAll("\\s+", " ");
        if (!normalizedPhoneNumber.matches("[0-9]+")) {
            throw new IllegalArgumentException("Instapay refund phone number must contain numbers only");
        }
        if (!normalizedPhoneNumber.matches("01[0-9]{9}")) {
            throw new IllegalArgumentException("Instapay refund phone number must be an Egyptian phone number starting with 01");
        }
        if (!normalizedName.matches("\\p{L}+(?:\\s+\\p{L}+)*")) {
            throw new IllegalArgumentException("Instapay refund name must contain letters only");
        }
        return new InstapayRefundDetails(normalizedPhoneNumber, normalizedName);
    }

    private record InstapayRefundDetails(String phoneNumber, String name) {}

    private boolean isVendorForwardTransition(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return true;
        }
        return switch (current) {
            case PENDING -> next == OrderStatus.PAID;
            case PAID -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };
    }

    private void ensureInstapayVendorFlowIsNotBypassed(Order order, OrderStatus oldStatus, OrderStatus newStatus) {
        if (!"INSTAPAY".equalsIgnoreCase(order.getPaymentMethod())
                || oldStatus == newStatus
                || order.getVendorStatuses().isEmpty()) {
            return;
        }
        if (isVendorManagedAggregateStatus(oldStatus) && isVendorManagedAggregateStatus(newStatus)) {
            throw new IllegalStateException(
                    "Use Send to vendors to release Instapay orders; vendor portions must be advanced by vendors.");
        }
    }

    private boolean isVendorManagedAggregateStatus(OrderStatus status) {
        return status == OrderStatus.PENDING_CONFIRMATION
                || status == OrderStatus.IN_PROGRESS
                || status == OrderStatus.OUT_FOR_DELIVERY
                || status == OrderStatus.DONE;
    }

    @Override
    public com.giftastic.giftastic.common.dto.OrderSecurityDTO getOrderSecurity(UUID orderId) {
        Order order = getOrThrow(orderId);
        
        // Extract all unique supplier IDs from the order items
        java.util.Set<UUID> supplierIds = order.getItems().stream()
            .map(item -> {
                try {
                    Product product = productService.getOrThrow(item.getProductId());
                    return product.getSupplierId();
                } catch (Exception e) {
                    return null;
                }
            })
            .filter(java.util.Objects::nonNull)
            .collect(java.util.stream.Collectors.toSet());
        
        return new com.giftastic.giftastic.common.dto.OrderSecurityDTO(
            order.getId(),
            order.getCustomerId(),
            supplierIds
        );
    }

    private Order getOrThrow(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + id));
    }

    @Override
    public Order getOrderById(UUID orderId) {
        return getOrThrow(orderId);
    }

    @Override
    public Order getGuestOrder(UUID orderId, String email, String phone) {
        Order order = getAuthorizedGuestOrder(orderId, email, phone);
        enrichOrders(List.of(order));
        return order;
    }

    @Override
    public Page<Order> getCustomerOrders(UUID customerId, Pageable pageable) {
        Page<Order> orders = orderRepository.findByCustomerId(customerId, pageable);
        enrichOrders(orders.getContent());
        return orders;
    }

    @Override
    public Page<Order> getVendorOrders(UUID supplierId, Pageable pageable) {
        Page<Order> orders = orderRepository.findBySupplierId(supplierId, pageable);
        enrichOrders(orders.getContent());
        return orders;
    }

    @Override
    public Page<VendorOrderResponse> getVendorOrderResponses(UUID supplierId, Pageable pageable) {
        return getVendorOrders(supplierId, pageable)
                .map(order -> VendorOrderResponse.from(order, supplierId, resolveCustomerPhone(order)));
    }

    @Override
    public Page<Order> getAllOrders(Pageable pageable) {
        Page<Order> orders = orderRepository.findAll(pageable);
        enrichOrders(orders.getContent());
        return orders;
    }

    private OrderItem createPricedOrderItem(OrderItem requested, java.time.LocalDateTime pricingAt,
                                             java.util.Map<UUID, java.math.BigDecimal> commissionRates) {
        Product product = productService.getOrThrow(requested.getProductId());
        if (!product.hasStock(requested.getQuantity())) {
            throw new IllegalArgumentException(stockErrorMessage(product, requested.getQuantity()));
        }
        java.math.BigDecimal rate = commissionRates.computeIfAbsent(product.getSupplierId(), supplierId ->
                commissionPricingService.getApplicableRate(supplierId, pricingAt));
        java.math.BigDecimal customerPrice = com.giftastic.giftastic.common.pricing.CommissionPriceQuote
                .calculate(product.getDiscountedPrice(), rate, product.getEffectivePricingMode()).customerPrice();
        return new OrderItem(requested.getProductId(), product.getName(),
                product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0).getUrl() : null,
                requested.getQuantity(), customerPrice, product.getSupplierId(), requested.getGroupId(), requested.getMetadata());
    }

    private Order getAuthorizedGuestOrder(UUID orderId, String email, String phone) {
        Order order = getOrThrow(orderId);
        GuestInfo guestInfo = order.getGuestInfo();
        if (order.getCustomerId() != null || guestInfo == null || !matchesGuestContact(guestInfo, email, phone)) {
            throw new org.springframework.security.access.AccessDeniedException("Guest order details do not match");
        }
        return order;
    }

    private static boolean matchesGuestContact(GuestInfo guestInfo, String email, String phone) {
        String expectedEmail = normalizeEmail(guestInfo.getEmail());
        String expectedPhone = normalizePhone(guestInfo.getPhone());
        return !expectedEmail.isBlank()
                && !expectedPhone.isBlank()
                && expectedEmail.equals(normalizeEmail(email))
                && expectedPhone.equals(normalizePhone(phone));
    }

    private static String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static String normalizePhone(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String stockErrorMessage(Product product, int requestedQuantity) {
        Integer available = product.getStockQuantity();
        return "The product '" + product.getName() + "' only has "
                + (available == null ? 0 : available)
                + " items available, but you requested "
                + requestedQuantity
                + ". Please adjust the quantity.";
    }

    private String resolveCustomerPhone(Order order) {
        if (order.getGuestInfo() != null) {
            return order.getGuestInfo().getPhone();
        }
        if (order.getCustomerId() == null) {
            return null;
        }
        try {
            return userService.getById(order.getCustomerId()).getPhoneNumber();
        } catch (Exception ignored) {
            return null;
        }
    }

    @Override
    public Page<Order> getPendingConfirmationOrders(Pageable pageable) {
        Page<Order> orders = orderRepository.findByStatus(OrderStatus.PENDING_CONFIRMATION, pageable);
        enrichOrders(orders.getContent());
        return orders;
    }

    private void enrichOrders(List<Order> orders) {
        for (Order order : orders) {
            boolean changed = false;
            if (order.getCustomerName() == null && order.getCustomerId() != null) {
                try {
                    User user = userService.getById(order.getCustomerId());
                    order.setCustomerName(user.getFullName() != null ? user.getFullName() : user.getEmail());
                    order.setCustomerEmail(user.getEmail());
                    changed = true;
                } catch (Exception e) {}
            }
            
            for (OrderItem item : order.getItems()) {
                if (item.getProductName() == null) {
                    try {
                        Product p = productService.getOrThrow(item.getProductId());
                        item.setProductName(p.getName());
                        item.setImageUrl(p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getUrl() : null);
                        changed = true;
                    } catch (Exception e) {}
                }
            }
            
            if (changed) {
                orderRepository.save(order);
            }
        }
    }
}

package com.giftastic.giftastic.modules.order.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.notification.domain.Notification;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.repository.NotificationRepository;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryNotificationServiceImpl implements DeliveryNotificationService {

    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");
    
    @Override
    @Transactional
    public void notifyDeliveryDelay(UUID orderId, String reason, LocalDateTime newEstimatedDate) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (order.getCustomerId() == null) {
            log.warn("Cannot send delay notification for guest order: {}", orderId);
            return;
        }
        
        String title = "Delivery Delay - Order #" + orderId.toString().substring(0, 8);
        String message = String.format(
            "We apologize for the delay in your order delivery. %s. " +
            "New estimated delivery date: %s",
            reason,
            newEstimatedDate.format(DATE_FORMATTER)
        );
        
        Notification notification = Notification.create(
            order.getCustomerId(),
            title,
            message,
            NotificationType.DELIVERY_DELAY,
            String.format("{\"orderId\":\"%s\",\"newEstimatedDate\":\"%s\"}", orderId, newEstimatedDate)
        );
        
        notificationRepository.save(notification);
        
        // Update order estimate
        order.updateEstimatedDelivery(newEstimatedDate, reason);
        orderRepository.save(order);
        
        log.info("Delivery delay notification sent for order: {}", orderId);
    }
    
    @Override
    @Transactional
    public void notifyEstimateUpdate(UUID orderId, LocalDateTime newEstimatedDate) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (order.getCustomerId() == null) {
            log.warn("Cannot send estimate update for guest order: {}", orderId);
            return;
        }
        
        String title = "Delivery Update - Order #" + orderId.toString().substring(0, 8);
        String message = String.format(
            "Your order delivery estimate has been updated. " +
            "New estimated delivery date: %s",
            newEstimatedDate.format(DATE_FORMATTER)
        );
        
        Notification notification = Notification.create(
            order.getCustomerId(),
            title,
            message,
            NotificationType.DELIVERY_ESTIMATE_UPDATE,
            String.format("{\"orderId\":\"%s\",\"estimatedDate\":\"%s\"}", orderId, newEstimatedDate)
        );
        
        notificationRepository.save(notification);
        
        log.info("Delivery estimate update notification sent for order: {}", orderId);
    }
    
    @Override
    @Transactional
    public void updateDeliveryEstimate(UUID orderId, LocalDateTime estimatedDate, String notes) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        order.updateEstimatedDelivery(estimatedDate, notes);
        orderRepository.save(order);
        
        // Send notification if customer exists
        if (order.getCustomerId() != null) {
            notifyEstimateUpdate(orderId, estimatedDate);
        }
        
        log.info("Delivery estimate updated for order: {}", orderId);
    }
}

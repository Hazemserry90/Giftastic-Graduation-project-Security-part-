package com.giftastic.giftastic.modules.notification.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.notification.domain.Notification;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;

public interface NotificationService {
    void sendNotification(UUID userId, String title, String message, NotificationType type, String metadata);
    void sendUserEmail(UUID userId, String subject, String message);
    void sendGuestEmail(String email, String subject, String message);
    
    List<Notification> getNotificationsForUser(UUID userId);
    void markAsRead(UUID notificationId);
    void markAllAsRead(UUID userId);
    long getUnreadCount(UUID userId);
}

package com.giftastic.giftastic.modules.notification.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.notification.domain.Notification;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationProvider notificationProvider;

    @Override
    @Transactional
    public void sendNotification(UUID userId, String title, String message, NotificationType type, String metadata) {
        if (userId == null) {
            log.debug("Skipping in-app notification without user recipient: {}", title);
            return;
        }
        log.info("Sending in-app notification to user {}: {}", userId, title);
        Notification notification = Notification.create(userId, title, message, type, metadata);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void sendUserEmail(UUID userId, String subject, String message) {
        log.info("Sending email notification to user {}: {}", userId, subject);
        // In a real app, you'd fetch the user's email from UserRepository
        String dummyEmail = "user-" + userId + "@example.com";
        
        // Always create an in-app notification too
        sendNotification(userId, subject, message, NotificationType.SYSTEM_ALERT, null);
        
        // Infrastructure WIP: just log the email sending for now
        notificationProvider.sendNotification(dummyEmail, subject, message);
    }

    @Override
    public void sendGuestEmail(String email, String subject, String message) {
        log.info("Sending email to guest {}: {}", email, subject);
        notificationProvider.sendNotification(email, subject, message);
    }

    @Override
    public List<Notification> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.markAsRead();
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(Notification::markAsRead);
        notificationRepository.saveAll(unread);
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
}

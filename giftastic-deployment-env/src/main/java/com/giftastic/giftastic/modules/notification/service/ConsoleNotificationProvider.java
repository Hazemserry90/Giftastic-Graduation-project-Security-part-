package com.giftastic.giftastic.modules.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Stub implementation of NotificationProvider that logs notifications to console.
 * This is a temporary implementation until a real email/SMS provider is integrated.
 */
@Service
public class ConsoleNotificationProvider implements NotificationProvider {

    private static final Logger logger = LoggerFactory.getLogger(ConsoleNotificationProvider.class);

    @Override
    public void sendNotification(String recipient, String subject, String content) {
        logger.info("=== NOTIFICATION SENT ===");
        logger.info("To: {}", recipient);
        logger.info("Subject: {}", subject);
        logger.info("Content: {}", content);
        logger.info("========================");
    }
}

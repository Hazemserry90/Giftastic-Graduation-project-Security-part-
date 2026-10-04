package com.giftastic.giftastic.modules.notification.service;

/**
 * Tech-agnostic interface for sending out notifications,
 * e.g., Emails via SES, SMS via Twilio, etc.
 */
public interface NotificationProvider {
    /**
     * Send a simple text notification to a recipient address.
     * @param recipient The email/phone number.
     * @param subject The subject line of the notification.
     * @param content The internal content body.
     */
    void sendNotification(String recipient, String subject, String content);
}

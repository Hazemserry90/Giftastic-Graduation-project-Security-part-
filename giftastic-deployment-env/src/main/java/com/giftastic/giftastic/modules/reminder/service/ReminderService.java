package com.giftastic.giftastic.modules.reminder.service;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.reminder.domain.Reminder;

public interface ReminderService {
    /**
     * Schedule a new reminder for the user.
     */
    Reminder scheduleReminder(UUID customerId, String description, LocalDateTime scheduledAt);

    Reminder updateReminder(UUID reminderId, UUID customerId, String description, LocalDateTime scheduledAt);

    /**
     * Finds due reminders and triggers notifications for them.
     * To be triggered by an external scheduler (e.g. Cron expression).
     */
    void processDueReminders();
    
    void deleteReminder(UUID reminderId, UUID requestingUserId, boolean isAdmin);
    
    java.util.List<Reminder> getCustomerReminders(UUID customerId);
}

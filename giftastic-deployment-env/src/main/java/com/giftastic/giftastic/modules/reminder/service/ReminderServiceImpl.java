package com.giftastic.giftastic.modules.reminder.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.reminder.domain.Reminder;
import com.giftastic.giftastic.modules.reminder.repository.ReminderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReminderServiceImpl implements ReminderService {

    private final ReminderRepository reminderRepository;
    private final NotificationService notificationService;
    private static final int MAX_ACTIVE_REMINDERS = 8;

    @Override
    @Transactional
    public Reminder scheduleReminder(UUID customerId, String description, LocalDateTime scheduledAt) {
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot schedule a reminder in the past");
        }
        
        long activeCount = reminderRepository.countByCustomerIdAndProcessedFalse(customerId);
        if (activeCount >= MAX_ACTIVE_REMINDERS) {
            throw new IllegalStateException("Maximum of " + MAX_ACTIVE_REMINDERS + " active reminders allowed.");
        }
        
        Reminder reminder = Reminder.create(customerId, description, scheduledAt);
        return reminderRepository.save(reminder);
    }

    @Override
    @Transactional
    public Reminder updateReminder(UUID reminderId, UUID customerId, String description, LocalDateTime scheduledAt) {
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot schedule a reminder in the past");
        }
        Reminder reminder = reminderRepository.findById(reminderId)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        if (!reminder.getCustomerId().equals(customerId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot update someone else's reminder.");
        }
        reminder.update(description, scheduledAt);
        return reminderRepository.save(reminder);
    }
    
    @Override
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    @Transactional
    public void processDueReminders() {
        List<Reminder> dueReminders = reminderRepository.findByProcessedFalseAndScheduledAtLessThanEqual(LocalDateTime.now());
        
        for (Reminder reminder : dueReminders) {
            try {
                notificationService.sendNotification(
                    reminder.getCustomerId(), 
                    "Reminder",
                    reminder.getDescription(),
                    NotificationType.REMINDER,
                    "{\"reminderId\":\"" + reminder.getId() + "\"}"
                );
                
                reminder.markAsProcessed();
                reminderRepository.save(reminder);
            } catch (Exception e) {
                // If one fails, we log it and continue the batch processing.
                // Log exception in real system
            }
        }
    }
    
    @Transactional
    public void deleteReminder(UUID reminderId, UUID requestingUserId, boolean isAdmin) {
        Reminder reminder = reminderRepository.findById(reminderId)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
            
        if (!isAdmin && !reminder.getCustomerId().equals(requestingUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot delete someone else's reminder directly.");
        }
        reminderRepository.delete(reminder);
    }

    public List<Reminder> getCustomerReminders(UUID customerId) {
        return reminderRepository.findByCustomerId(customerId);
    }
}

package com.giftastic.giftastic.modules.reminder.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.reminder.domain.Reminder;
import com.giftastic.giftastic.modules.reminder.repository.ReminderRepository;

@ExtendWith(MockitoExtension.class)
class ReminderServiceImplTests {

    @Mock
    private ReminderRepository reminderRepository;

    @Mock
    private NotificationService notificationService;

    private ReminderServiceImpl reminderService;

    @BeforeEach
    void setUp() {
        reminderService = new ReminderServiceImpl(reminderRepository, notificationService);
    }

    @Test
    void processDueRemindersCreatesInAppReminderNotification() {
        UUID customerId = UUID.randomUUID();
        Reminder reminder = Reminder.create(customerId, "Buy birthday gift", LocalDateTime.now().minusMinutes(1));
        when(reminderRepository.findByProcessedFalseAndScheduledAtLessThanEqual(any()))
                .thenReturn(List.of(reminder));

        reminderService.processDueReminders();

        verify(notificationService).sendNotification(
                eq(customerId),
                eq("Reminder"),
                eq("Buy birthday gift"),
                eq(NotificationType.REMINDER),
                contains(reminder.getId().toString()));
        verify(notificationService, never()).sendUserEmail(any(), any(), any());
        assertThat(reminder.isProcessed()).isTrue();
        verify(reminderRepository).save(reminder);
    }
}

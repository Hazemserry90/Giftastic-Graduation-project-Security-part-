package com.giftastic.giftastic.modules.reminder.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.reminder.domain.Reminder;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    long countByCustomerIdAndProcessedFalse(UUID customerId);
    
    List<Reminder> findByProcessedFalseAndScheduledAtLessThanEqual(LocalDateTime time);
    
    List<Reminder> findByCustomerId(UUID customerId);
}

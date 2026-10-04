package com.giftastic.giftastic.modules.reminder.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reminders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reminder {
    @Id
    private UUID id;
    
    private UUID customerId;
    
    private String description;
    
    private LocalDateTime scheduledAt;
    
    private boolean processed;

    public static Reminder create(UUID customerId, String description, LocalDateTime scheduledAt) {
        Reminder reminder = new Reminder();
        reminder.id = UUID.randomUUID();
        reminder.customerId = customerId;
        reminder.description = description;
        reminder.scheduledAt = scheduledAt;
        reminder.processed = false;
        return reminder;
    }

    public void markAsProcessed() {
        this.processed = true;
    }

    public void update(String description, LocalDateTime scheduledAt) {
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.processed = false;
    }
}

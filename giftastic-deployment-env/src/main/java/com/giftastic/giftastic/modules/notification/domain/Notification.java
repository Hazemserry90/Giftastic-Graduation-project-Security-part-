package com.giftastic.giftastic.modules.notification.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Notification {

    @Id
    @NonNull
    private UUID id;

    @NonNull
    @Column(nullable = false)
    private UUID userId;

    @NonNull
    @Column(nullable = false)
    private String title;

    @NonNull
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @NonNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private boolean read = false;

    @NonNull
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON or additional info

    public static Notification create(
            @NonNull UUID userId,
            @NonNull String title,
            @NonNull String message,
            @NonNull NotificationType type,
            String metadata
    ) {
        Notification notification = new Notification();
        notification.id = UUID.randomUUID();
        notification.userId = userId;
        notification.title = title;
        notification.message = message;
        notification.type = type;
        notification.read = false;
        notification.createdAt = LocalDateTime.now();
        notification.metadata = metadata;
        return notification;
    }

    public void markAsRead() {
        this.read = true;
    }
}

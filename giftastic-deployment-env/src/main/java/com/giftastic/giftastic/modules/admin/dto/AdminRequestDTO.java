package com.giftastic.giftastic.modules.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.giftastic.giftastic.modules.admin.domain.AdminRequestStatus;

public record AdminRequestDTO(
    UUID id,
    UUID userId,
    String userEmail,
    String userFullName,
    String message,
    AdminRequestStatus status,
    LocalDateTime requestedAt,
    LocalDateTime reviewedAt,
    UUID reviewedBy,
    String reviewNotes,
    LocalDateTime canReapplyAt
) {}

package com.giftastic.giftastic.modules.report.dto;

import java.util.UUID;

import com.giftastic.giftastic.modules.report.domain.ReportType;

public record CreateReportRequest(
    ReportType reportType,
    UUID reportedEntityId,
    String reason,
    String description
) {}

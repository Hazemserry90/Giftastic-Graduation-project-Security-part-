package com.giftastic.giftastic.modules.report.dto;

import com.giftastic.giftastic.modules.report.domain.ReportStatus;

public record UpdateReportStatusRequest(
    ReportStatus status,
    String adminNotes
) {}

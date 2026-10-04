package com.giftastic.giftastic.modules.report.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.giftastic.giftastic.modules.report.domain.Report;
import com.giftastic.giftastic.modules.report.domain.ReportStatus;
import com.giftastic.giftastic.modules.report.domain.ReportType;

public interface ReportService {
    Report createReport(UUID reporterId, ReportType reportType, UUID reportedEntityId, String reason, String description);
    Report getReportById(UUID reportId);
    Page<Report> getAllReports(Pageable pageable);
    Page<Report> getReportsByStatus(ReportStatus status, Pageable pageable);
    Page<Report> getReportsByType(ReportType reportType, Pageable pageable);
    Page<Report> getReportsByEntity(UUID entityId, Pageable pageable);
    Page<Report> getMyReports(UUID reporterId, Pageable pageable);
    void markUnderReview(UUID reportId, UUID adminId);
    void markActionTaken(UUID reportId, UUID adminId, String notes, String action);
    void dismissReport(UUID reportId, UUID adminId, String notes);
    void resolveReport(UUID reportId, UUID adminId, String notes);
}

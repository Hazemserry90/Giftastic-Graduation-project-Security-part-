package com.giftastic.giftastic.modules.report.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.giftastic.giftastic.common.exception.ResourceNotFoundException;
import com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository;
import com.giftastic.giftastic.modules.notification.domain.NotificationType;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.report.domain.Report;
import com.giftastic.giftastic.modules.report.domain.ReportOutcomeType;
import com.giftastic.giftastic.modules.report.domain.ReportStatus;
import com.giftastic.giftastic.modules.report.domain.ReportType;
import com.giftastic.giftastic.modules.report.repository.ReportRepository;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final GiftFlowRepository giftFlowRepository;

    @Override
    @Transactional
    public Report createReport(UUID reporterId, ReportType reportType, UUID reportedEntityId, 
                               String reason, String description) {
        log.info("Creating report: reporter={}, type={}, entity={}", reporterId, reportType, reportedEntityId);
        
        // Check if user already reported this entity
        if (reportRepository.existsByReporterIdAndReportedEntityIdAndReportType(reporterId, reportedEntityId, reportType)) {
            throw new IllegalStateException("You have already reported this " + reportType.name().toLowerCase());
        }
        
        Report report = Report.create(reporterId, reportType, reportedEntityId, reason, description);
        return reportRepository.save(report);
    }

    @Override
    public Report getReportById(UUID reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));
    }

    @Override
    public Page<Report> getAllReports(Pageable pageable) {
        return reportRepository.findAll(pageable);
    }

    @Override
    public Page<Report> getReportsByStatus(ReportStatus status, Pageable pageable) {
        return reportRepository.findByStatus(status, pageable);
    }

    @Override
    public Page<Report> getReportsByType(ReportType reportType, Pageable pageable) {
        return reportRepository.findByReportType(reportType, pageable);
    }

    @Override
    public Page<Report> getReportsByEntity(UUID entityId, Pageable pageable) {
        return reportRepository.findByReportedEntityId(entityId, pageable);
    }

    @Override
    public Page<Report> getMyReports(UUID reporterId, Pageable pageable) {
        return reportRepository.findByReporterId(reporterId, pageable);
    }

    @Override
    @Transactional
    public void markUnderReview(UUID reportId, UUID adminId) {
        Report report = getReportById(reportId);
        report.markUnderReview(adminId);
        reportRepository.save(report);
        log.info("Report {} marked under review by admin {}", reportId, adminId);
    }

    @Override
    @Transactional
    public void markActionTaken(UUID reportId, UUID adminId, String notes, String action) {
        Report report = getReportById(reportId);
        report.markActionTaken(adminId, notes, action);
        reportRepository.save(report);
        notifyReporterOfOutcome(report);
        log.info("Report {} marked as action taken by admin {}", reportId, adminId);
    }

    @Override
    @Transactional
    public void dismissReport(UUID reportId, UUID adminId, String notes) {
        Report report = getReportById(reportId);
        report.dismiss(adminId, notes);
        reportRepository.save(report);
        notifyReporterOfOutcome(report);
        log.info("Report {} resolved by admin {} through legacy dismiss endpoint", reportId, adminId);
    }

    @Override
    @Transactional
    public void resolveReport(UUID reportId, UUID adminId, String notes) {
        Report report = getReportById(reportId);
        report.resolve(adminId, notes);
        reportRepository.save(report);
        notifyReporterOfOutcome(report);
        log.info("Report {} resolved by admin {}", reportId, adminId);
    }

    private void notifyReporterOfOutcome(Report report) {
        if (report == null || report.getReporterId() == null || report.getOutcomeType() == null) {
            return;
        }
        String targetName = resolveReportedEntityName(report);
        String outcomeText = report.getOutcomeType() == ReportOutcomeType.ACTION_TAKEN
                ? "action taken: " + getOutcomeActionLabel(report.getOutcomeAction())
                : "resolved";
        String message = "Your report on " + targetName + " has resulted in " + outcomeText + ".";
        notificationService.sendNotification(
                report.getReporterId(),
                "Report update",
                message,
                NotificationType.SYSTEM_ALERT,
                "{\"reportId\":\"" + report.getId() + "\",\"outcomeType\":\"" + report.getOutcomeType()
                        + "\",\"outcomeAction\":\"" + (report.getOutcomeAction() == null ? "" : report.getOutcomeAction()) + "\"}"
        );
    }

    private String resolveReportedEntityName(Report report) {
        return switch (report.getReportType()) {
            case USER, ADMIN -> vendorRepository.findByUserId(report.getReportedEntityId())
                    .map(Vendor::getStoreName)
                    .map(name -> safeName(name, "the reported vendor"))
                    .or(() -> userRepository.findById(report.getReportedEntityId())
                            .map(this::userDisplayName))
                    .orElse("the reported user");
            case VENDOR -> vendorDisplayName(report.getReportedEntityId());
            case PRODUCT -> productRepository.findById(report.getReportedEntityId())
                    .map(product -> safeName(product.getName(), "the reported product"))
                    .orElse("the reported product");
            case GIFT_FLOW -> giftFlowRepository.findById(report.getReportedEntityId())
                    .map(flow -> safeName(flow.getName(), "the reported gift flow"))
                    .orElse("the reported gift flow");
        };
    }

    private String vendorDisplayName(UUID id) {
        return vendorRepository.findBySupplierId(id)
                .or(() -> vendorRepository.findByUserId(id))
                .map(Vendor::getStoreName)
                .map(name -> safeName(name, "the reported vendor"))
                .orElse("the reported vendor");
    }

    private String userDisplayName(User user) {
        if (user == null) {
            return "the reported user";
        }
        return safeName(user.getFullName(), safeName(user.getEmail(), "the reported user"));
    }

    private String safeName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String getOutcomeActionLabel(String action) {
        return switch (action == null ? "" : action) {
            case "BAN_USER" -> "banned user";
            case "DEACTIVATE_VENDOR" -> "deactivated vendor";
            default -> "admin action";
        };
    }
}

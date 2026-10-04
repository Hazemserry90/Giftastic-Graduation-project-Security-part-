package com.giftastic.giftastic.modules.report.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.report.domain.Report;
import com.giftastic.giftastic.modules.report.domain.ReportStatus;
import com.giftastic.giftastic.modules.report.domain.ReportType;
import com.giftastic.giftastic.modules.report.dto.CreateReportRequest;
import com.giftastic.giftastic.modules.report.service.ReportService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Report management endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Create a report",
        description = "Submit a report for a product, gift flow, user, vendor, or admin. Users can only report each entity once."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Report created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "409", description = "Already reported this entity")
    })
    public ResponseEntity<Report> createReport(@RequestBody CreateReportRequest request) {
        UUID reporterId = SecurityUtils.getCurrentUserId();
        Report report = reportService.createReport(
            reporterId,
            request.reportType(),
            request.reportedEntityId(),
            request.reason(),
            request.description()
        );
        return ResponseEntity.status(201).body(report);
    }

    @GetMapping("/my-reports")
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Get my reports",
        description = "Returns all reports submitted by the authenticated user"
    )
    public ResponseEntity<Page<Report>> getMyReports(Pageable pageable) {
        UUID reporterId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(reportService.getMyReports(reporterId, pageable));
    }

    @GetMapping
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Get all reports",
        description = "Returns all reports in the system. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Page<Report>> getAllReports(Pageable pageable) {
        return ResponseEntity.ok(reportService.getAllReports(pageable));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Get reports by status",
        description = "Returns reports filtered by status. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Page<Report>> getReportsByStatus(
            @Parameter(description = "Report status to filter by") @PathVariable ReportStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getReportsByStatus(status, pageable));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Get reports by type",
        description = "Returns reports filtered by type (PRODUCT, USER, VENDOR, etc.). Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Page<Report>> getReportsByType(
            @Parameter(description = "Report type to filter by") @PathVariable ReportType type,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getReportsByType(type, pageable));
    }

    @GetMapping("/entity/{entityId}")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Get reports for a specific entity",
        description = "Returns all reports for a specific product, user, vendor, etc. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Page<Report>> getReportsByEntity(
            @Parameter(description = "ID of the reported entity") @PathVariable UUID entityId,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getReportsByEntity(entityId, pageable));
    }

    @GetMapping("/{reportId}")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Get report details",
        description = "Returns detailed information about a specific report. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Report> getReport(
            @Parameter(description = "Report ID") @PathVariable UUID reportId) {
        return ResponseEntity.ok(reportService.getReportById(reportId));
    }

    @PatchMapping("/{reportId}/under-review")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Mark report as under review",
        description = "Changes report status to UNDER_REVIEW. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Void> markUnderReview(
            @Parameter(description = "Report ID") @PathVariable UUID reportId) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        reportService.markUnderReview(reportId, adminId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{reportId}/action-taken")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Mark report as action taken",
        description = "Changes report status to ACTION_TAKEN with admin notes. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Void> markActionTaken(
            @Parameter(description = "Report ID") @PathVariable UUID reportId,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String action) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        reportService.markActionTaken(reportId, adminId, notes, action);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{reportId}/dismiss")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Dismiss report",
        description = "Dismisses a report as invalid or not requiring action. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Void> dismissReport(
            @Parameter(description = "Report ID") @PathVariable UUID reportId,
            @RequestParam(required = false) String notes) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        reportService.dismissReport(reportId, adminId, notes);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{reportId}/resolve")
    @PreAuthorize("hasPermission(null, 'MANAGE_REPORTS')")
    @Operation(
        summary = "Resolve report",
        description = "Marks a report as fully resolved. Requires MANAGE_REPORTS permission."
    )
    public ResponseEntity<Void> resolveReport(
            @Parameter(description = "Report ID") @PathVariable UUID reportId,
            @RequestParam(required = false) String notes) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        reportService.resolveReport(reportId, adminId, notes);
        return ResponseEntity.noContent().build();
    }
}

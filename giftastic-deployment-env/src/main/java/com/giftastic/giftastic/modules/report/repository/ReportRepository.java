package com.giftastic.giftastic.modules.report.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.report.domain.Report;
import com.giftastic.giftastic.modules.report.domain.ReportStatus;
import com.giftastic.giftastic.modules.report.domain.ReportType;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
    Page<Report> findByReportType(ReportType reportType, Pageable pageable);
    Page<Report> findByReportedEntityId(UUID reportedEntityId, Pageable pageable);
    Page<Report> findByReporterId(UUID reporterId, Pageable pageable);
    List<Report> findByReportedEntityIdAndReportType(UUID reportedEntityId, ReportType reportType);
    boolean existsByReporterIdAndReportedEntityIdAndReportType(UUID reporterId, UUID reportedEntityId, ReportType reportType);
}

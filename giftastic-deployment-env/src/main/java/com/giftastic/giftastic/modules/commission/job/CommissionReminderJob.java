package com.giftastic.giftastic.modules.commission.job;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.repository.CommissionRepository;
import com.giftastic.giftastic.modules.commission.service.CommissionService;
import com.giftastic.giftastic.modules.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommissionReminderJob {

    private final CommissionRepository commissionRepository;
    private final CommissionService commissionService;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * MON")
    public void sendWeeklyReminders() {
        log.info("Starting weekly commission payment reminders");

        commissionService.markOverdueCommissions();

        List<Commission> unpaidCommissions = commissionRepository.findUnpaidOrderByDueDateAsc();

        Map<UUID, VendorCommissionSummary> vendorSummaries = new HashMap<>();

        for (Commission commission : unpaidCommissions) {
            UUID supplierId = commission.getSupplierId();
            VendorCommissionSummary summary = vendorSummaries.computeIfAbsent(
                    supplierId, k -> new VendorCommissionSummary());

            summary.count++;
            summary.totalAmount = summary.totalAmount.add(commission.getCommissionAmount());
        }

        for (Map.Entry<UUID, VendorCommissionSummary> entry : vendorSummaries.entrySet()) {
            UUID supplierId = entry.getKey();
            VendorCommissionSummary summary = entry.getValue();

            String message = String.format(
                    "You have %d unpaid commission%s totaling %.2f. Please submit payment proof through your vendor dashboard.",
                    summary.count,
                    summary.count > 1 ? "s" : "",
                    summary.totalAmount
            );

            notificationService.sendNotification(
                    supplierId,
                    "Weekly Commission Reminder",
                    message,
                    com.giftastic.giftastic.modules.notification.domain.NotificationType.REMINDER,
                    "{\"count\":" + summary.count + ",\"totalAmount\":\"" + summary.totalAmount + "\"}"
            );
        }

        log.info("Sent weekly reminders to {} vendors", vendorSummaries.size());
    }

    private static class VendorCommissionSummary {
        int count = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
    }
}

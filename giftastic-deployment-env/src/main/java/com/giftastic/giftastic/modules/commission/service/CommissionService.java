package com.giftastic.giftastic.modules.commission.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionStatus;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.admin.domain.AdminPermission;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;
import com.giftastic.giftastic.modules.commission.dto.CommissionDTO;
import com.giftastic.giftastic.modules.commission.repository.CommissionRepository;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommissionService {

    private final CommissionRepository commissionRepository;
    private final VendorRepository vendorRepository;
    private final NotificationService notificationService;
    private final AdminRepository adminRepository;
    private final CommissionPricingService commissionPricingService;
    private final com.giftastic.giftastic.modules.order.repository.OrderRepository orderRepository;
    private final com.giftastic.giftastic.common.config.OrderFlowConfig orderFlowConfig;

    @Transactional
    public void createCommissionsForOrder(Order order) {
        log.info("Creating commissions for order: {}, status: {}", order.getId(), order.getStatus());
        
        Map<UUID, BigDecimal> supplierSubtotals = calculateSupplierSubtotals(order);
        log.info("Calculated subtotals for {} suppliers", supplierSubtotals.size());

        for (Map.Entry<UUID, BigDecimal> entry : supplierSubtotals.entrySet()) {
            UUID supplierId = entry.getKey();
            BigDecimal subtotal = entry.getValue();

            if (supplierId == null) {
                log.warn("Skipping commission creation for null supplierId in order {}", order.getId());
                continue;
            }

            if (commissionRepository.findByOrderIdAndSupplierId(order.getId(), supplierId).isPresent()
                    || !isVendorPortionSettlementEligible(order, supplierId, LocalDateTime.now())) {
                continue;
            }

            Commission commission = createFromOrderSnapshot(order, supplierId, subtotal, LocalDateTime.now());
            commissionRepository.save(commission);
            
            log.info("Created commission {} for supplier {} with amount {} (rate: {})", 
                commission.getId(), supplierId, commission.getCommissionAmount(), commission.getCommissionRate());
        }
    }

    @Transactional
    public void createInstapayCommissionsForOrder(Order order) {
        calculateSupplierSubtotals(order).forEach((supplierId, subtotal) -> {
            if (supplierId != null
                    && isVendorPortionSettlementEligible(order, supplierId, LocalDateTime.now())
                    && commissionRepository.findByOrderIdAndSupplierId(order.getId(), supplierId).isEmpty()) {
                commissionRepository.save(createFromOrderSnapshot(order, supplierId, subtotal, LocalDateTime.now()));
            }
        });
    }

    @Transactional
    public void createCodCommissionForVendor(Order order, UUID supplierId) {
        BigDecimal subtotal = calculateSupplierSubtotals(order).get(supplierId);
        if (subtotal != null
                && isVendorPortionSettlementEligible(order, supplierId, LocalDateTime.now())
                && commissionRepository.findByOrderIdAndSupplierId(order.getId(), supplierId).isEmpty()) {
            commissionRepository.save(createFromOrderSnapshot(order, supplierId, subtotal, LocalDateTime.now()));
        }
    }

    @Transactional
    public void createCommissionForSuccessfulVendorPortion(Order order, UUID supplierId, LocalDateTime successfulAt) {
        if (supplierId == null || order.isVendorPortionInvalid(supplierId)
                || !isVendorPortionSettlementEligible(order, supplierId, successfulAt)
                || commissionRepository.findByOrderIdAndSupplierId(order.getId(), supplierId).isPresent()) {
            return;
        }
        BigDecimal subtotal = calculateSupplierSubtotals(order).get(supplierId);
        if (subtotal == null) return;
        Commission commission = createFromOrderSnapshot(order, supplierId, subtotal, successfulAt);
        commissionRepository.save(commission);
    }

    public boolean hasCommissionForVendorPortion(UUID orderId, UUID supplierId) {
        return commissionRepository.findByOrderIdAndSupplierId(orderId, supplierId).isPresent();
    }

    public void ensureVendorPortionCanChangeMoney(Commission commission) {
        Order order = orderRepository.findById(commission.getOrderId())
                .orElseThrow(() -> new IllegalStateException("Order not found for commission"));
        if (!order.getVendorStatuses().containsKey(commission.getSupplierId())) {
            return;
        }
        if (!order.getVendorFinancialReleaseAt().containsKey(commission.getSupplierId())) {
            return;
        }
        if (order.isVendorPortionInvalid(commission.getSupplierId())) {
            throw new IllegalStateException("This vendor portion was invalidated and cannot change money");
        }
        if (!order.isVendorPortionFinanciallyEligible(commission.getSupplierId(), LocalDateTime.now(),
                orderFlowConfig.getCustomerProblemWindowMinutes())) {
            throw new IllegalStateException("Payment requests are locked until the customer problem window finishes");
        }
    }

    private Map<UUID, BigDecimal> calculateSupplierSubtotals(Order order) {
        if (order.getVendorSubtotals() != null && !order.getVendorSubtotals().isEmpty()) {
            return new HashMap<>(order.getVendorSubtotals());
        }
        Map<UUID, BigDecimal> subtotals = new HashMap<>();

        for (OrderItem item : order.getItems()) {
            UUID supplierId = item.getSupplierId();
            
            if (supplierId == null) {
                log.warn("OrderItem {} in order {} has null supplierId", item.getProductId(), order.getId());
                continue;
            }
            
            BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotals.merge(supplierId, itemTotal, BigDecimal::add);
            log.debug("Added {} to supplier {} subtotal", itemTotal, supplierId);
        }

        return subtotals;
    }

    private BigDecimal getApplicableRate(UUID supplierId, LocalDateTime date) {
        return commissionPricingService.getApplicableRate(supplierId, date);
    }

    private BigDecimal getOrderRate(Order order, UUID supplierId) {
        BigDecimal snapshotted = order.getCommissionRateFor(supplierId);
        return snapshotted != null ? snapshotted : getApplicableRate(supplierId, order.getPlacedAt());
    }

    private Commission createFromOrderSnapshot(Order order, UUID supplierId, BigDecimal subtotal, LocalDateTime financialStartedAt) {
        return "INSTAPAY".equalsIgnoreCase(order.getPaymentMethod())
                ? Commission.createVendorPayout(order.getId(), supplierId, subtotal, getOrderRate(order, supplierId), financialStartedAt)
                : Commission.create(order.getId(), supplierId, subtotal, getOrderRate(order, supplierId), financialStartedAt);
    }

    public List<CommissionDTO> getVendorPendingCommissions(UUID supplierId) {
        List<Commission> commissions = commissionRepository.findBySupplierIdAndStatus(supplierId, CommissionStatus.PENDING);
        commissions.addAll(commissionRepository.findBySupplierIdAndStatus(supplierId, CommissionStatus.OVERDUE));
        return commissions.stream()
                .map(c -> CommissionDTO.from(c, getVendorName(c.getSupplierId())))
                .collect(Collectors.toList());
    }

    public List<CommissionDTO> getVendorCommissionHistory(UUID supplierId) {
        List<Commission> commissions = commissionRepository.findBySupplierIdOrderByDueDateAsc(supplierId);
        return commissions.stream()
                .map(c -> CommissionDTO.from(c, getVendorName(c.getSupplierId())))
                .collect(Collectors.toList());
    }

    public List<CommissionDTO> getAllUnpaidCommissions() {
        List<Commission> commissions = commissionRepository.findUnpaidOrderByDueDateAsc();
        return commissions.stream()
                .filter(c -> c.effectiveDirection() == CommissionDirection.VENDOR_TO_PLATFORM)
                .map(c -> CommissionDTO.from(c, getVendorName(c.getSupplierId())))
                .collect(Collectors.toList());
    }

    public List<CommissionDTO> getEligibleInstapayPayouts() {
        LocalDateTime now = LocalDateTime.now();
        return commissionRepository.findByDirectionOrderByCreatedAtDesc(CommissionDirection.PLATFORM_TO_VENDOR)
                .stream()
                .flatMap(commission -> orderRepository.findById(commission.getOrderId())
                        .map(order -> Map.entry(commission, order)).stream())
                .filter(entry -> isVendorPortionSettlementEligible(
                        entry.getValue(), entry.getKey().getSupplierId(), now))
                .map(entry -> CommissionDTO.from(entry.getKey(),
                        getVendorName(entry.getKey().getSupplierId()), entry.getValue()))
                .collect(Collectors.toList());
    }

    private boolean isVendorPortionSettlementEligible(Order order, UUID supplierId, LocalDateTime now) {
        if (!order.isVendorPortionFinanciallyEligible(
                supplierId, now, orderFlowConfig.getCustomerProblemWindowMinutes())) {
            return false;
        }
        return !"INSTAPAY".equalsIgnoreCase(order.getPaymentMethod())
                || order.getPaymentConfirmedAt() != null;
    }

    @Transactional
    public void urgePayment(UUID commissionId) {
        Commission commission = commissionRepository.findById(commissionId)
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        ensureVendorPortionCanChangeMoney(commission);

        if (commission.effectiveDirection() != CommissionDirection.VENDOR_TO_PLATFORM) {
            throw new IllegalStateException("Only vendor-to-platform commissions can be urged by an admin");
        }
        notificationService.sendNotification(
                getVendorUserId(commission.getSupplierId()),
                "Commission Payment Reminder",
                "Please submit payment proof for commission of " + commission.getCommissionAmount() + " for order " + commission.getOrderId(),
                com.giftastic.giftastic.modules.notification.domain.NotificationType.REMINDER,
                "{\"commissionId\":\"" + commissionId + "\",\"orderId\":\"" + commission.getOrderId() + "\"}"
        );
    }

    @Transactional
    public void urgePlatformPayment(UUID commissionId, UUID supplierId) {
        Commission commission = commissionRepository.findById(commissionId)
                .orElseThrow(() -> new IllegalArgumentException("Commission not found"));
        ensureVendorPortionCanChangeMoney(commission);
        if (!commission.getSupplierId().equals(supplierId)) throw new IllegalArgumentException("Commission does not belong to vendor");
        if (commission.effectiveDirection() != CommissionDirection.PLATFORM_TO_VENDOR) {
            throw new IllegalStateException("Only Instapay vendor payouts can be urged");
        }
        adminRepository.findAll().stream()
                .filter(a -> a.hasPermission(AdminPermission.MANAGE_VENDOR_PAYOUTS))
                .forEach(admin ->
            notificationService.sendNotification(admin.getUserId(), "Vendor payout requested",
                "Vendor requested " + commission.getPayableAmount() + " for order " + commission.getOrderId(),
                com.giftastic.giftastic.modules.notification.domain.NotificationType.REMINDER,
                "{\"commissionId\":\"" + commissionId + "\",\"orderId\":\"" + commission.getOrderId() + "\"}"));
    }

    @Transactional
    public void markOverdueCommissions() {
        List<Commission> overdueCommissions = commissionRepository.findOverdueCommissions(LocalDateTime.now());
        for (Commission commission : overdueCommissions) {
            commission.markAsOverdue();
            commissionRepository.save(commission);
        }
    }

    private String getVendorName(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(v -> v.getStoreName())
                .orElse("Unknown Vendor");
    }

    private UUID getVendorUserId(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(Vendor::getUserId)
                .orElse(supplierId);
    }
}

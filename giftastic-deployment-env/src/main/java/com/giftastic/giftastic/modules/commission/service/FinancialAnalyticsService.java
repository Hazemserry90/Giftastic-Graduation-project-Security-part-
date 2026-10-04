package com.giftastic.giftastic.modules.commission.service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.commission.domain.CommissionStatus;
import com.giftastic.giftastic.modules.commission.dto.FinancialAnalyticsDTO;
import com.giftastic.giftastic.modules.commission.dto.FinancialAnalyticsDTO.InvalidVendorPortionSummary;
import com.giftastic.giftastic.modules.commission.dto.FinancialAnalyticsDTO.MonthlyFinancialSummary;
import com.giftastic.giftastic.modules.commission.dto.FinancialAnalyticsDTO.VendorFinancialSummary;
import com.giftastic.giftastic.modules.commission.repository.CommissionRepository;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FinancialAnalyticsService {

    private final OrderRepository orderRepository;
    private final CommissionRepository commissionRepository;
    private final VendorRepository vendorRepository;

    @Transactional(readOnly = true)
    public FinancialAnalyticsDTO getFinancialAnalytics() {
        List<Order> allOrders = orderRepository.findAll();
        List<Order> financialOrders = allOrders.stream()
                .filter(this::isFinancialOrder)
                .toList();
        List<Commission> allCommissions = commissionRepository.findAll();
        Map<java.util.UUID, Order> ordersById = allOrders.stream()
                .collect(Collectors.toMap(Order::getId, order -> order, (first, second) -> first));
        List<Commission> validCommissions = allCommissions.stream()
                .filter(commission -> {
                    Order order = ordersById.get(commission.getOrderId());
                    return order == null || !order.isVendorPortionInvalid(commission.getSupplierId());
                })
                .toList();

        BigDecimal totalItemSubtotal = financialOrders.stream()
                .flatMap(order -> validFinancialItems(order).stream())
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDeliveryCost = financialOrders.stream()
                .map(this::validDeliveryCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCustomerPayments = totalItemSubtotal.add(totalDeliveryCost);
        BigDecimal codOrderValue = financialOrders.stream()
                .filter(order -> "COD".equalsIgnoreCase(order.getPaymentMethod()))
                .map(this::orderFinancialTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal instapayOrderValue = financialOrders.stream()
                .filter(order -> "INSTAPAY".equalsIgnoreCase(order.getPaymentMethod()))
                .map(this::orderFinancialTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal invalidOrFailedPayments = allOrders.stream()
                .filter(this::isInvalidOrFailedOrder)
                .map(order -> order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingVendorPayments = sumCommissions(validCommissions, CommissionDirection.VENDOR_TO_PLATFORM,
                CommissionStatus.PENDING, CommissionStatus.OVERDUE);
        BigDecimal submittedVendorPayments = sumCommissions(validCommissions, CommissionDirection.VENDOR_TO_PLATFORM,
                CommissionStatus.PAYMENT_SUBMITTED);
        BigDecimal completedVendorPayments = sumCommissions(validCommissions, CommissionDirection.VENDOR_TO_PLATFORM,
                CommissionStatus.PAID);
        BigDecimal pendingVendorPayouts = sumPayables(validCommissions, CommissionDirection.PLATFORM_TO_VENDOR,
                CommissionStatus.PENDING, CommissionStatus.OVERDUE);
        BigDecimal submittedVendorPayouts = sumPayables(validCommissions, CommissionDirection.PLATFORM_TO_VENDOR,
                CommissionStatus.PAYMENT_SUBMITTED);
        BigDecimal completedVendorPayouts = sumPayables(validCommissions, CommissionDirection.PLATFORM_TO_VENDOR,
                CommissionStatus.PAID);

        BigDecimal totalCommissionsOwed = pendingVendorPayments.add(submittedVendorPayments);
        BigDecimal totalCommissionsPaid = completedVendorPayments;
        BigDecimal totalPlatformRevenue = validCommissions.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalVendorEarnings = totalItemSubtotal.subtract(totalPlatformRevenue);

        List<VendorFinancialSummary> byVendor = calculateVendorSummaries(validCommissions);
        List<MonthlyFinancialSummary> byMonth = calculateMonthlySummaries(financialOrders, validCommissions, allOrders);
        List<InvalidVendorPortionSummary> invalidVendorPortions = calculateInvalidVendorPortions(allOrders);

        return new FinancialAnalyticsDTO(
                totalItemSubtotal,
                totalDeliveryCost,
                totalCustomerPayments,
                totalVendorEarnings,
                totalCommissionsOwed,
                totalCommissionsPaid,
                totalPlatformRevenue,
                codOrderValue,
                instapayOrderValue,
                pendingVendorPayments,
                submittedVendorPayments,
                completedVendorPayments,
                pendingVendorPayouts,
                submittedVendorPayouts,
                completedVendorPayouts,
                invalidOrFailedPayments,
                financialOrders.stream().filter(order -> "COD".equalsIgnoreCase(order.getPaymentMethod())).count(),
                financialOrders.stream().filter(order -> "INSTAPAY".equalsIgnoreCase(order.getPaymentMethod())).count(),
                allOrders.stream().filter(this::isInvalidOrFailedOrder).count(),
                byVendor,
                byMonth,
                invalidVendorPortions
        );
    }

    private List<VendorFinancialSummary> calculateVendorSummaries(List<Commission> commissions) {
        Map<UUID, VendorData> vendorDataMap = new HashMap<>();

        for (Commission commission : commissions) {
            UUID supplierId = commission.getSupplierId();
            VendorData data = vendorDataMap.computeIfAbsent(supplierId, k -> new VendorData());

            if (commission.effectiveDirection() == CommissionDirection.VENDOR_TO_PLATFORM) {
                if (commission.getStatus() == CommissionStatus.PAID) {
                    data.commissionsPaid = data.commissionsPaid.add(commission.getCommissionAmount());
                } else if (commission.getStatus() == CommissionStatus.PENDING
                        || commission.getStatus() == CommissionStatus.OVERDUE
                        || commission.getStatus() == CommissionStatus.PAYMENT_SUBMITTED) {
                    data.commissionsOwed = data.commissionsOwed.add(commission.getCommissionAmount());
                }
            } else if (commission.getStatus() == CommissionStatus.PAID) {
                data.completedPayouts = data.completedPayouts.add(commission.getPayableAmount());
            } else if (commission.getStatus() == CommissionStatus.PENDING
                    || commission.getStatus() == CommissionStatus.OVERDUE
                    || commission.getStatus() == CommissionStatus.PAYMENT_SUBMITTED) {
                data.pendingPayouts = data.pendingPayouts.add(commission.getPayableAmount());
            }

            data.totalEarnings = data.totalEarnings.add(commission.getOrderSubtotal());
            data.platformCommission = data.platformCommission.add(commission.getCommissionAmount());
        }

        List<VendorFinancialSummary> summaries = new ArrayList<>();
        for (Map.Entry<UUID, VendorData> entry : vendorDataMap.entrySet()) {
            UUID supplierId = entry.getKey();
            VendorData data = entry.getValue();
            String storeName = getVendorName(supplierId);

            BigDecimal netEarnings = data.totalEarnings.subtract(data.platformCommission);

            summaries.add(new VendorFinancialSummary(
                    supplierId.toString(),
                    storeName,
                    netEarnings,
                    data.commissionsPaid,
                    data.commissionsOwed,
                    data.pendingPayouts,
                    data.completedPayouts
            ));
        }

        return summaries;
    }

    private List<MonthlyFinancialSummary> calculateMonthlySummaries(List<Order> orders, List<Commission> commissions,
                                                                    List<Order> allOrders) {
        Map<String, MonthlyData> monthlyDataMap = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Order order : orders) {
            String month = order.getPlacedAt().format(formatter);
            MonthlyData data = monthlyDataMap.computeIfAbsent(month, k -> new MonthlyData());
            BigDecimal orderItemSubtotal = validFinancialItems(order).stream()
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal deliveryCost = validDeliveryCost(order);
            data.itemSubtotal = data.itemSubtotal.add(orderItemSubtotal);
            data.deliveryTotal = data.deliveryTotal.add(deliveryCost);
            data.customerPayments = data.customerPayments.add(orderItemSubtotal.add(deliveryCost));
            if ("INSTAPAY".equalsIgnoreCase(order.getPaymentMethod())) {
                data.instapayOrderValue = data.instapayOrderValue.add(orderItemSubtotal.add(deliveryCost));
            } else if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
                data.codOrderValue = data.codOrderValue.add(orderItemSubtotal.add(deliveryCost));
            }
        }

        for (Commission commission : commissions) {
            if (commission.getStatus() == CommissionStatus.PAID && commission.getPaidAt() != null) {
                String month = commission.getPaidAt().format(formatter);
                MonthlyData data = monthlyDataMap.computeIfAbsent(month, k -> new MonthlyData());
                if (commission.effectiveDirection() == CommissionDirection.VENDOR_TO_PLATFORM) {
                    data.commissionsCollected = data.commissionsCollected.add(commission.getCommissionAmount());
                } else {
                    data.vendorPayoutsCompleted = data.vendorPayoutsCompleted.add(commission.getPayableAmount());
                }
            }
        }

        for (Order order : allOrders) {
            if (!isInvalidOrFailedOrder(order)) continue;
            String month = order.getPlacedAt().format(formatter);
            MonthlyData data = monthlyDataMap.computeIfAbsent(month, k -> new MonthlyData());
            data.invalidOrFailedPayments = data.invalidOrFailedPayments.add(
                    order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount());
        }

        return monthlyDataMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new MonthlyFinancialSummary(
                        entry.getKey(),
                entry.getValue().itemSubtotal,
                entry.getValue().deliveryTotal,
                        entry.getValue().customerPayments,
                        entry.getValue().commissionsCollected,
                        entry.getValue().vendorPayoutsCompleted,
                        entry.getValue().codOrderValue,
                        entry.getValue().instapayOrderValue,
                        entry.getValue().invalidOrFailedPayments
                ))
                .collect(Collectors.toList());
    }

    private List<InvalidVendorPortionSummary> calculateInvalidVendorPortions(List<Order> orders) {
        Map<UUID, InvalidVendorData> invalidData = new HashMap<>();

        for (Order order : orders) {
            order.getVendorStatuses().forEach((supplierId, status) -> {
                if (!order.isVendorPortionInvalid(supplierId)) return;

                InvalidVendorData data = invalidData.computeIfAbsent(supplierId, key -> new InvalidVendorData());
                data.invalidatedPortions++;
                data.invalidatedSubtotal = data.invalidatedSubtotal.add(order.getVendorSubtotalFor(supplierId));

                java.time.LocalDateTime invalidatedAt = order.getVendorInvalidatedAt().get(supplierId);
                if (data.latestInvalidatedAt == null || (invalidatedAt != null && invalidatedAt.isAfter(data.latestInvalidatedAt))) {
                    data.latestInvalidatedAt = invalidatedAt;
                    data.latestReason = order.getVendorInvalidationReasons().get(supplierId);
                    data.latestDetails = order.getVendorInvalidationDetails().get(supplierId);
                }
            });
        }

        return invalidData.entrySet().stream()
                .sorted(Map.Entry.<UUID, InvalidVendorData>comparingByValue(
                        java.util.Comparator.comparing((InvalidVendorData data) -> data.invalidatedPortions)
                                .thenComparing(data -> data.invalidatedSubtotal)
                                .reversed()))
                .map(entry -> new InvalidVendorPortionSummary(
                        entry.getKey().toString(),
                        getVendorName(entry.getKey()),
                        entry.getValue().invalidatedPortions,
                        entry.getValue().invalidatedSubtotal,
                        entry.getValue().latestReason,
                        entry.getValue().latestDetails,
                        entry.getValue().latestInvalidatedAt
                ))
                .collect(Collectors.toList());
    }

    private String getVendorName(UUID supplierId) {
        return vendorRepository.findBySupplierId(supplierId)
                .map(Vendor::getStoreName)
                .orElse("Unknown Vendor");
    }

    private List<com.giftastic.giftastic.modules.order.domain.OrderItem> validFinancialItems(Order order) {
        return order.getItems().stream()
                .filter(item -> item.getSupplierId() != null && !order.isVendorPortionInvalid(item.getSupplierId()))
                .toList();
    }

    private BigDecimal validDeliveryCost(Order order) {
        if (order.getDeliveryCost() == null) return BigDecimal.ZERO;
        if (order.getDeliveryCostBreakdown() == null || order.getDeliveryCostBreakdown().isBlank()) {
            return order.getVendorStatuses().keySet().stream().anyMatch(supplierId -> !order.isVendorPortionInvalid(supplierId))
                    ? order.getDeliveryCost()
                    : BigDecimal.ZERO;
        }
        try {
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readTree(order.getDeliveryCostBreakdown());
            BigDecimal total = BigDecimal.ZERO;
            java.util.Iterator<Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> entry = fields.next();
                UUID supplierId = UUID.fromString(entry.getKey());
                if (!order.isVendorPortionInvalid(supplierId)) {
                    total = total.add(entry.getValue().decimalValue());
                }
            }
            return total;
        } catch (Exception ignored) {
            return order.getDeliveryCost();
        }
    }

    private boolean isFinancialOrder(Order order) {
        if (order == null || isInvalidOrFailedOrder(order) || order.getStatus() == OrderStatus.PENDING_CONFIRMATION) {
            return false;
        }
        return !"INSTAPAY".equalsIgnoreCase(order.getPaymentMethod()) || order.getPaymentConfirmedAt() != null;
    }

    private boolean isInvalidOrFailedOrder(Order order) {
        return order != null && (order.getStatus() == OrderStatus.INVALID
                || order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.REFUNDED);
    }

    private BigDecimal orderFinancialTotal(Order order) {
        BigDecimal items = validFinancialItems(order).stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return items.add(validDeliveryCost(order));
    }

    private BigDecimal sumCommissions(List<Commission> commissions, CommissionDirection direction,
                                      CommissionStatus... statuses) {
        return commissions.stream()
                .filter(commission -> commission.effectiveDirection() == direction)
                .filter(commission -> List.of(statuses).contains(commission.getStatus()))
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumPayables(List<Commission> commissions, CommissionDirection direction,
                                   CommissionStatus... statuses) {
        return commissions.stream()
                .filter(commission -> commission.effectiveDirection() == direction)
                .filter(commission -> List.of(statuses).contains(commission.getStatus()))
                .map(Commission::getPayableAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static class VendorData {
        BigDecimal totalEarnings = BigDecimal.ZERO;
        BigDecimal platformCommission = BigDecimal.ZERO;
        BigDecimal commissionsPaid = BigDecimal.ZERO;
        BigDecimal commissionsOwed = BigDecimal.ZERO;
        BigDecimal pendingPayouts = BigDecimal.ZERO;
        BigDecimal completedPayouts = BigDecimal.ZERO;
    }

    private static class MonthlyData {
        BigDecimal itemSubtotal = BigDecimal.ZERO;
        BigDecimal deliveryTotal = BigDecimal.ZERO;
        BigDecimal customerPayments = BigDecimal.ZERO;
        BigDecimal commissionsCollected = BigDecimal.ZERO;
        BigDecimal vendorPayoutsCompleted = BigDecimal.ZERO;
        BigDecimal codOrderValue = BigDecimal.ZERO;
        BigDecimal instapayOrderValue = BigDecimal.ZERO;
        BigDecimal invalidOrFailedPayments = BigDecimal.ZERO;
    }

    private static class InvalidVendorData {
        long invalidatedPortions = 0;
        BigDecimal invalidatedSubtotal = BigDecimal.ZERO;
        String latestReason;
        String latestDetails;
        java.time.LocalDateTime latestInvalidatedAt;
    }
}

package com.giftastic.giftastic.modules.order.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import com.giftastic.giftastic.common.pricing.CommissionRates;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // Required by JPA
public class Order {
    @Id
    @NonNull
    private UUID id;

    @Column(nullable = true)
    private UUID customerId;

    @Embedded
    @jakarta.persistence.AttributeOverrides({
        @jakarta.persistence.AttributeOverride(name = "shippingAddress", column = @jakarta.persistence.Column(name = "guest_shipping_address"))
    })
    private GuestInfo guestInfo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private OrderStatus status;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @NonNull
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 19, scale = 2)
    @NonNull
    private BigDecimal totalAmount;

    @Column(nullable = false)
    @NonNull
    private LocalDateTime placedAt;

    private String shippingAddress;
    private String paymentMethod;
    private String customerName;
    private String customerEmail;
    private String instapayPhoneNumber;
    private String instapayRefundPhoneNumber;
    private String instapayRefundName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_instapay_transaction_ids", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "transaction_id", nullable = false)
    private Set<String> instapayTransactionIds = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_instapay_payment_messages", joinColumns = @JoinColumn(name = "order_id"))
    @OrderColumn(name = "message_index")
    private List<InstapayPaymentMessage> instapayPaymentMessages = new ArrayList<>();

    @Column(name = "payment_method_locked_at")
    private LocalDateTime paymentMethodLockedAt;

    @Column(name = "payment_confirmed_at")
    private LocalDateTime paymentConfirmedAt;

    @Column(name = "payment_confirmed_by")
    private UUID paymentConfirmedBy;

    @Column(name = "payment_rejection_reason", columnDefinition = "TEXT")
    private String paymentRejectionReason;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_statuses", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Map<UUID, VendorOrderStatus> vendorStatuses = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_completed_at", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "completed_at", nullable = false)
    private Map<UUID, LocalDateTime> vendorCompletedAt = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_financial_release_at", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "financial_release_at", nullable = false)
    private Map<UUID, LocalDateTime> vendorFinancialReleaseAt = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_commission_rates", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private Map<UUID, BigDecimal> commissionRates = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_subtotals", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "vendor_subtotal", nullable = false, precision = 19, scale = 2)
    private Map<UUID, BigDecimal> vendorSubtotals = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_commission_amounts", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "commission_amount", nullable = false, precision = 19, scale = 2)
    private Map<UUID, BigDecimal> vendorCommissionAmounts = new HashMap<>();

    @Column(name = "commission_rates_snapshotted_at")
    private LocalDateTime commissionRatesSnapshottedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_invalidated_at", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "invalidated_at", nullable = false)
    private Map<UUID, LocalDateTime> vendorInvalidatedAt = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_invalidated_by", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "invalidated_by", nullable = false)
    private Map<UUID, UUID> vendorInvalidatedBy = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_invalidation_reasons", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "reason", nullable = false, length = 120)
    private Map<UUID, String> vendorInvalidationReasons = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_vendor_invalidation_details", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "supplier_id")
    @Column(name = "details", nullable = false, columnDefinition = "TEXT")
    private Map<UUID, String> vendorInvalidationDetails = new HashMap<>();
    
    private UUID deliveryZoneId;
    
    @Column(precision = 19, scale = 2)
    private BigDecimal deliveryCost;
    
    @Column(columnDefinition = "TEXT")
    private String deliveryCostBreakdown; // JSON: {"vendorId": cost, ...}
    
    private LocalDateTime estimatedDeliveryDate;
    
    private LocalDateTime actualDeliveryDate;
    
    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;
    
    @Column(name = "commission_paid", columnDefinition = "BOOLEAN DEFAULT false")
    private boolean commissionPaid = false;
    
    @Column(name = "commission_paid_at")
    private LocalDateTime commissionPaidAt;

    private Order(UUID id, UUID customerId, String customerName, String customerEmail, GuestInfo guestInfo, List<OrderItem> items, String shippingAddress, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, int cancelGracePeriodMinutes, UUID deliveryZoneId, BigDecimal deliveryCost, String deliveryCostBreakdown) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.guestInfo = guestInfo;
        this.items = new ArrayList<>(items);
        this.status = OrderStatus.PENDING_CONFIRMATION;
        this.placedAt = LocalDateTime.now();
        this.shippingAddress = shippingAddress;
        this.paymentMethod = paymentMethod;
        this.instapayPhoneNumber = instapayPhoneNumber;
        this.instapayRefundPhoneNumber = instapayRefundPhoneNumber;
        this.instapayRefundName = instapayRefundName;
        this.paymentMethodLockedAt = this.placedAt.plusMinutes(cancelGracePeriodMinutes);
        validatePaymentMethod(paymentMethod);
        items.stream().map(OrderItem::getSupplierId).filter(java.util.Objects::nonNull).distinct()
                .forEach(supplierId -> this.vendorStatuses.put(supplierId, VendorOrderStatus.WAITING_FOR_RELEASE));
        this.deliveryZoneId = deliveryZoneId;
        this.deliveryCost = deliveryCost != null ? deliveryCost : BigDecimal.ZERO;
        this.deliveryCostBreakdown = deliveryCostBreakdown;
        // Calculate total amount based on items + delivery cost
        BigDecimal itemsTotal = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalAmount = itemsTotal.add(this.deliveryCost);
    }

    public static Order place(UUID customerId, String customerName, String customerEmail, List<OrderItem> items, String shippingAddress, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, int cancelGracePeriodMinutes, UUID deliveryZoneId, BigDecimal deliveryCost, String deliveryCostBreakdown) {
        if (items == null || items.isEmpty()) throw new IllegalArgumentException("Cannot place order without items");
        return new Order(UUID.randomUUID(), customerId, customerName, customerEmail, null, items, shippingAddress, paymentMethod, instapayPhoneNumber, instapayRefundPhoneNumber, instapayRefundName, cancelGracePeriodMinutes, deliveryZoneId, deliveryCost, deliveryCostBreakdown);
    }

    public static Order placeAsGuest(GuestInfo guestInfo, List<OrderItem> items, String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, int cancelGracePeriodMinutes, UUID deliveryZoneId, BigDecimal deliveryCost, String deliveryCostBreakdown) {
        if (items == null || items.isEmpty()) throw new IllegalArgumentException("Cannot place order without items");
        if (guestInfo == null) throw new IllegalArgumentException("Guest info is required");
        return new Order(UUID.randomUUID(), null, guestInfo.getFirstName() + " " + guestInfo.getLastName(), guestInfo.getEmail(), guestInfo, items, guestInfo.getShippingAddress(), paymentMethod, instapayPhoneNumber, instapayRefundPhoneNumber, instapayRefundName, cancelGracePeriodMinutes, deliveryZoneId, deliveryCost, deliveryCostBreakdown);
    }

    public void markAsPaid() {
        ensureStatus(OrderStatus.PENDING);
        this.status = OrderStatus.PAID;
    }

    public void markAsShipped() {
        ensureStatus(OrderStatus.PAID);
        this.status = OrderStatus.SHIPPED;
    }

    public boolean canCancelOrDelete(LocalDateTime now) {
        return status == OrderStatus.PENDING_CONFIRMATION
                && paymentMethodLockedAt != null
                && now.isBefore(paymentMethodLockedAt);
    }

    public void cancel(LocalDateTime now) {
        if (!canCancelOrDelete(now)) {
            throw new IllegalStateException("Order can only be cancelled during the grace period");
        }
        if (this.status == OrderStatus.SHIPPED || this.status == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel a shipped or delivered order");
        }
        this.status = OrderStatus.CANCELLED;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public void synchronizeVendorStatusesForAggregateStatus(OrderStatus status, LocalDateTime now, int customerProblemWindowMinutes) {
        this.status = status;
        if (status == OrderStatus.IN_PROGRESS) {
            vendorStatuses.replaceAll((supplierId, current) ->
                    current == VendorOrderStatus.INVALID ? current : VendorOrderStatus.IN_PROGRESS);
        } else if (status == OrderStatus.OUT_FOR_DELIVERY) {
            vendorStatuses.replaceAll((supplierId, current) ->
                    current == VendorOrderStatus.DONE || current == VendorOrderStatus.INVALID
                            ? current : VendorOrderStatus.OUT_FOR_DELIVERY);
        } else if (status == OrderStatus.DONE) {
            vendorStatuses.replaceAll((supplierId, current) ->
                    current == VendorOrderStatus.INVALID ? current : VendorOrderStatus.DONE);
            vendorStatuses.forEach((supplierId, current) -> {
                if (current == VendorOrderStatus.DONE) {
                    vendorCompletedAt.putIfAbsent(supplierId, now);
                    vendorFinancialReleaseAt.putIfAbsent(supplierId, now.plusMinutes(customerProblemWindowMinutes));
                }
            });
        } else if (status == OrderStatus.INVALID) {
            vendorStatuses.replaceAll((supplierId, current) -> VendorOrderStatus.INVALID);
        } else if (status == OrderStatus.PENDING_CONFIRMATION) {
            vendorStatuses.replaceAll((supplierId, current) -> VendorOrderStatus.WAITING_FOR_RELEASE);
        }
    }

    public boolean canChangePaymentMethod(LocalDateTime now) {
        return paymentMethodLockedAt != null && now.isBefore(paymentMethodLockedAt)
                && status == OrderStatus.PENDING_CONFIRMATION;
    }

    public void changePaymentMethod(String paymentMethod, String instapayPhoneNumber, String instapayRefundPhoneNumber, String instapayRefundName, LocalDateTime now) {
        if (!canChangePaymentMethod(now)) throw new IllegalStateException("Payment method can no longer be changed");
        validatePaymentMethod(paymentMethod);
        this.paymentMethod = paymentMethod.toUpperCase();
        this.instapayPhoneNumber = "INSTAPAY".equals(this.paymentMethod) ? instapayPhoneNumber : null;
        this.instapayRefundPhoneNumber = "INSTAPAY".equals(this.paymentMethod) ? instapayRefundPhoneNumber : null;
        this.instapayRefundName = "INSTAPAY".equals(this.paymentMethod) ? instapayRefundName : null;
        if (!"INSTAPAY".equals(this.paymentMethod)) {
            this.instapayTransactionIds.clear();
            this.instapayPaymentMessages.clear();
            this.paymentRejectionReason = null;
        }
    }

    public void submitInstapayTransactionIds(List<String> transactionIds) {
        if (!"INSTAPAY".equalsIgnoreCase(paymentMethod)) throw new IllegalStateException("Order does not use Instapay");
        List<String> normalized = transactionIds == null ? List.of() : transactionIds.stream()
                .filter(java.util.Objects::nonNull).map(String::trim).filter(value -> !value.isBlank()).distinct().toList();
        if (normalized.isEmpty()) throw new IllegalArgumentException("Provide at least one transaction ID");
        LinkedHashSet<String> merged = new LinkedHashSet<>(this.instapayTransactionIds);
        List<String> newlySubmitted = normalized.stream()
                .filter(value -> !merged.contains(value))
                .toList();
        merged.addAll(normalized);
        if (merged.size() == this.instapayTransactionIds.size()) {
            throw new IllegalArgumentException("Provide at least one new transaction ID");
        }
        if (merged.size() > 4) throw new IllegalArgumentException("Provide no more than 4 transaction IDs");
        this.instapayTransactionIds = merged;
        this.instapayPaymentMessages.add(InstapayPaymentMessage.customer(
                "Submitted transaction IDs: " + String.join(", ", newlySubmitted),
                LocalDateTime.now()));
    }

    public void confirmInstapayPayment(UUID adminId) {
        confirmInstapayPayment(adminId, LocalDateTime.now());
    }

    public void confirmInstapayPayment(UUID adminId, LocalDateTime now) {
        if (!"INSTAPAY".equalsIgnoreCase(paymentMethod) || status != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalStateException("Only pending Instapay orders can be confirmed");
        }
        if (instapayTransactionIds.isEmpty()) throw new IllegalStateException("Transaction IDs are required");
        this.paymentConfirmedAt = now;
        this.paymentConfirmedBy = adminId;
        this.paymentRejectionReason = null;
        this.instapayPaymentMessages.add(InstapayPaymentMessage.platform("Approved", now));
        releaseToVendors();
    }

    public void rejectInstapayPayment(String reason) {
        if (!"INSTAPAY".equalsIgnoreCase(paymentMethod) || status != OrderStatus.PENDING_CONFIRMATION) {
            throw new IllegalStateException("Only pending Instapay orders can be rejected");
        }
        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.isBlank()) throw new IllegalArgumentException("Rejection reason is required");
        this.paymentRejectionReason = normalizedReason;
        this.instapayTransactionIds.clear();
        this.instapayPaymentMessages.add(InstapayPaymentMessage.platform("Rejected: " + normalizedReason, LocalDateTime.now()));
    }

    public boolean releaseCodIfReady(LocalDateTime now) {
        if ("COD".equalsIgnoreCase(paymentMethod) && status == OrderStatus.PENDING_CONFIRMATION
                && paymentMethodLockedAt != null && !now.isBefore(paymentMethodLockedAt)) {
            releaseToVendors();
            return true;
        }
        return false;
    }

    public void updateVendorStatus(UUID supplierId, VendorOrderStatus next) {
        VendorOrderStatus current = vendorStatuses.get(supplierId);
        if (current == null) throw new IllegalArgumentException("Vendor is not part of this order");
        boolean valid = current == next
                || current == VendorOrderStatus.WAITING_FOR_RELEASE && status != OrderStatus.PENDING_CONFIRMATION && next == VendorOrderStatus.IN_PROGRESS
                || current == VendorOrderStatus.IN_PROGRESS && next == VendorOrderStatus.OUT_FOR_DELIVERY
                || current == VendorOrderStatus.OUT_FOR_DELIVERY && next == VendorOrderStatus.DONE;
        if (!valid) throw new IllegalStateException("Invalid vendor order status transition");
        vendorStatuses.put(supplierId, next);
        if (next == VendorOrderStatus.DONE) {
            vendorCompletedAt.putIfAbsent(supplierId, LocalDateTime.now());
        }
        refreshAggregateVendorStatus();
    }

    public boolean isVendorPortionInvalid(UUID supplierId) {
        return vendorStatuses.get(supplierId) == VendorOrderStatus.INVALID;
    }

    public boolean isVendorPortionFinanciallyEligible(UUID supplierId, LocalDateTime now, int customerProblemWindowMinutes) {
        LocalDateTime releaseAt = vendorFinancialReleaseAt.get(supplierId);
        LocalDateTime completedAt = vendorCompletedAt.get(supplierId);
        if (releaseAt == null && completedAt != null) {
            releaseAt = completedAt.plusMinutes(customerProblemWindowMinutes);
        }
        return vendorStatuses.get(supplierId) == VendorOrderStatus.DONE
                && releaseAt != null
                && !now.isBefore(releaseAt);
    }

    public void setVendorFinancialReleaseAt(UUID supplierId, LocalDateTime releaseAt) {
        if (vendorStatuses.get(supplierId) != VendorOrderStatus.DONE) {
            throw new IllegalStateException("Financial release can only be scheduled for delivered vendor portions");
        }
        this.vendorFinancialReleaseAt.put(supplierId, releaseAt);
    }

    public void invalidateVendorPortion(UUID supplierId, UUID invalidatedBy, String reason, String details,
                                        LocalDateTime now, int customerProblemWindowMinutes) {
        VendorOrderStatus current = vendorStatuses.get(supplierId);
        if (current == null) throw new IllegalArgumentException("Vendor is not part of this order");
        if (invalidatedBy == null) throw new IllegalArgumentException("Invalidating admin is required");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Invalidation reason is required");
        if (details == null || details.isBlank()) throw new IllegalArgumentException("Invalidation details are required");
        if (current != VendorOrderStatus.DONE) {
            throw new IllegalStateException("Only delivered vendor portions can be invalidated");
        }
        LocalDateTime completedAt = vendorCompletedAt.get(supplierId);
        LocalDateTime releaseAt = vendorFinancialReleaseAt.getOrDefault(supplierId,
                completedAt == null ? null : completedAt.plusMinutes(customerProblemWindowMinutes));
        if (completedAt == null || releaseAt == null || now.isBefore(completedAt) || !now.isBefore(releaseAt)) {
            throw new IllegalStateException("Vendor portion can only be invalidated during the customer problem window");
        }
        vendorStatuses.put(supplierId, VendorOrderStatus.INVALID);
        vendorInvalidatedAt.put(supplierId, now);
        vendorInvalidatedBy.put(supplierId, invalidatedBy);
        vendorInvalidationReasons.put(supplierId, reason.trim());
        vendorInvalidationDetails.put(supplierId, details.trim());
        recalculateTotalAmountFromValidPortions();
        refreshAggregateVendorStatus();
    }

    private void refreshAggregateVendorStatus() {
        if (vendorStatuses.values().stream().allMatch(value -> value == VendorOrderStatus.DONE || value == VendorOrderStatus.INVALID)) status = OrderStatus.DONE;
        else if (vendorStatuses.values().stream().allMatch(value -> value == VendorOrderStatus.OUT_FOR_DELIVERY || value == VendorOrderStatus.DONE || value == VendorOrderStatus.INVALID)) status = OrderStatus.OUT_FOR_DELIVERY;
        else status = OrderStatus.IN_PROGRESS;
    }

    public void snapshotCommissionRates(Map<UUID, BigDecimal> rates, LocalDateTime snapshottedAt) {
        snapshotVendorFinancials(rates, calculateVendorSubtotalsFromItems(), snapshottedAt);
    }

    public void snapshotVendorFinancials(Map<UUID, BigDecimal> rates, Map<UUID, BigDecimal> subtotals,
                                         LocalDateTime snapshottedAt) {
        if (rates == null || !rates.keySet().containsAll(vendorStatuses.keySet())) {
            throw new IllegalArgumentException("Every order vendor must have a commission rate snapshot");
        }
        if (subtotals == null || !subtotals.keySet().containsAll(vendorStatuses.keySet())) {
            throw new IllegalArgumentException("Every order vendor must have a subtotal snapshot");
        }
        Map<UUID, BigDecimal> normalizedRates = new HashMap<>();
        rates.forEach((supplierId, rate) -> normalizedRates.put(supplierId, CommissionRates.requireFraction(rate)));
        if (subtotals.values().stream().anyMatch(subtotal -> subtotal == null || subtotal.compareTo(BigDecimal.ZERO) < 0)) {
            throw new IllegalArgumentException("Vendor subtotals cannot be negative");
        }
        if (!commissionRates.isEmpty() || !vendorSubtotals.isEmpty() || !vendorCommissionAmounts.isEmpty()) {
            throw new IllegalStateException("Vendor financials are already snapshotted");
        }
        this.commissionRates = normalizedRates;
        this.vendorSubtotals = new HashMap<>(subtotals);
        this.vendorCommissionAmounts = new HashMap<>();
        subtotals.forEach((supplierId, subtotal) -> this.vendorCommissionAmounts.put(supplierId,
                subtotal.multiply(normalizedRates.get(supplierId)).setScale(2, java.math.RoundingMode.HALF_UP)));
        this.commissionRatesSnapshottedAt = snapshottedAt;
    }

    public BigDecimal getCommissionRateFor(UUID supplierId) {
        return CommissionRates.normalizeToFraction(commissionRates.get(supplierId));
    }

    public BigDecimal getVendorSubtotalFor(UUID supplierId) {
        BigDecimal subtotal = vendorSubtotals.getOrDefault(supplierId, calculateVendorSubtotalsFromItems().get(supplierId));
        return subtotal == null ? BigDecimal.ZERO : subtotal;
    }

    public BigDecimal getVendorCommissionAmountFor(UUID supplierId) {
        BigDecimal rate = getCommissionRateFor(supplierId);
        if (rate == null) return vendorCommissionAmounts.get(supplierId);
        return getVendorSubtotalFor(supplierId).multiply(rate)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getValidVendorPortionsSubtotal() {
        Map<UUID, BigDecimal> subtotals = vendorSubtotals.isEmpty() ? calculateVendorSubtotalsFromItems() : vendorSubtotals;
        return subtotals.entrySet().stream()
                .filter(entry -> !isVendorPortionInvalid(entry.getKey()))
                .map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void recalculateTotalAmountFromValidPortions() {
        this.totalAmount = getValidVendorPortionsSubtotal().add(getValidDeliveryCost());
    }

    private Map<UUID, BigDecimal> calculateVendorSubtotalsFromItems() {
        Map<UUID, BigDecimal> subtotals = new HashMap<>();
        for (OrderItem item : items) {
            if (item.getSupplierId() == null) continue;
            subtotals.merge(item.getSupplierId(),
                    item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                    BigDecimal::add);
        }
        return subtotals;
    }

    private BigDecimal getValidDeliveryCost() {
        if (deliveryCost == null || !hasAnyValidVendorPortion()) return BigDecimal.ZERO;
        if (deliveryCostBreakdown == null || deliveryCostBreakdown.isBlank()) return deliveryCost;
        try {
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readTree(deliveryCostBreakdown);
            BigDecimal total = BigDecimal.ZERO;
            java.util.Iterator<Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> entry = fields.next();
                UUID supplierId = UUID.fromString(entry.getKey());
                if (!isVendorPortionInvalid(supplierId)) {
                    total = total.add(entry.getValue().decimalValue());
                }
            }
            return total;
        } catch (Exception ignored) {
            return deliveryCost;
        }
    }

    private boolean hasAnyValidVendorPortion() {
        return vendorStatuses.keySet().stream().anyMatch(supplierId -> !isVendorPortionInvalid(supplierId));
    }

    private void releaseToVendors() {
        this.status = OrderStatus.IN_PROGRESS;
        this.vendorStatuses.replaceAll((supplierId, current) -> VendorOrderStatus.IN_PROGRESS);
    }

    private static void validatePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || !(paymentMethod.equalsIgnoreCase("COD") || paymentMethod.equalsIgnoreCase("INSTAPAY"))) {
            throw new IllegalArgumentException("Payment method must be COD or INSTAPAY");
        }
    }

    private void ensureStatus(OrderStatus expected) {
        if (this.status != expected) {
            throw new IllegalStateException("Cannot transition from " + status + " to " + expected);
        }
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }
    
    public void updateEstimatedDelivery(LocalDateTime estimatedDate, String notes) {
        this.estimatedDeliveryDate = estimatedDate;
        if (notes != null) {
            this.deliveryNotes = notes;
        }
    }
    
    public void markAsDelivered(LocalDateTime actualDate) {
        ensureStatus(OrderStatus.SHIPPED);
        this.status = OrderStatus.DELIVERED;
        this.actualDeliveryDate = actualDate != null ? actualDate : LocalDateTime.now();
    }
    
    public boolean isDelayed() {
        if (estimatedDeliveryDate == null || status == OrderStatus.DELIVERED || status == OrderStatus.CANCELLED) {
            return false;
        }
        return LocalDateTime.now().isAfter(estimatedDeliveryDate);
    }
    
    public void markCommissionAsPaid() {
        this.commissionPaid = true;
        this.commissionPaidAt = LocalDateTime.now();
    }
}

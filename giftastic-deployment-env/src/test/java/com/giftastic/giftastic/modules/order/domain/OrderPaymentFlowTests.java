package com.giftastic.giftastic.modules.order.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.common.pricing.CommissionPriceQuote;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;

class OrderPaymentFlowTests {

    private static OrderItem item(UUID supplierId, String price) {
        return new OrderItem(UUID.randomUUID(), "Gift", null, 1, new BigDecimal(price),
                supplierId, null, null);
    }

    @Test
    void paymentMethodCanOnlyChangeDuringConfiguredGracePeriod() {
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(UUID.randomUUID(), "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);

        assertTrue(order.canChangePaymentMethod(order.getPlacedAt().plusMinutes(14)));
        order.changePaymentMethod("INSTAPAY", "+201000000000", "+201111111111", "Customer", order.getPlacedAt().plusMinutes(14));
        assertEquals("INSTAPAY", order.getPaymentMethod());
        assertFalse(order.canChangePaymentMethod(order.getPlacedAt().plusMinutes(15)));
        assertThrows(IllegalStateException.class, () ->
                order.changePaymentMethod("COD", null, null, null, order.getPlacedAt().plusMinutes(16)));
    }

    @Test
    void instapayIdsAreAddedAfterCheckoutAndAdminReleaseStartsVendorFlow() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "INSTAPAY", "+201000000000",
                "+201111111111", "Customer", 15, UUID.randomUUID(), BigDecimal.ZERO, null);

        order.submitInstapayTransactionIds(List.of("tx-1", "tx-2"));
        order.confirmInstapayPayment(UUID.randomUUID(), order.getPlacedAt().plusMinutes(1));

        assertEquals(OrderStatus.IN_PROGRESS, order.getStatus());
        assertEquals(VendorOrderStatus.IN_PROGRESS, order.getVendorStatuses().get(supplier));
        assertEquals(2, order.getInstapayTransactionIds().size());
        assertFalse(order.canChangePaymentMethod(order.getPlacedAt().plusMinutes(2)));
    }

    @Test
    void instapayTransactionIdsCanOnlyBeAppendedUntilFour() {
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(UUID.randomUUID(), "100")), "Address", "INSTAPAY", "+201000000000",
                "+201111111111", "Customer", 15, UUID.randomUUID(), BigDecimal.ZERO, null);

        order.submitInstapayTransactionIds(List.of("tx-1"));
        order.submitInstapayTransactionIds(List.of("tx-2"));
        order.submitInstapayTransactionIds(List.of("tx-3", "tx-4"));

        assertEquals(4, order.getInstapayTransactionIds().size());
        assertTrue(order.getInstapayTransactionIds().contains("tx-1"));
        assertThrows(IllegalArgumentException.class, () ->
                order.submitInstapayTransactionIds(List.of("tx-5")));
        assertThrows(IllegalArgumentException.class, () ->
                order.submitInstapayTransactionIds(List.of("tx-1")));
    }

    @Test
    void aggregateOrderStatusFollowsAllVendorPortions() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(first, "100"), item(second, "50")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.releaseCodIfReady(order.getPlacedAt().plusMinutes(16));

        order.updateVendorStatus(first, VendorOrderStatus.OUT_FOR_DELIVERY);
        assertEquals(OrderStatus.IN_PROGRESS, order.getStatus());
        order.updateVendorStatus(second, VendorOrderStatus.OUT_FOR_DELIVERY);
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, order.getStatus());
        order.updateVendorStatus(first, VendorOrderStatus.DONE);
        order.updateVendorStatus(second, VendorOrderStatus.DONE);
        assertEquals(OrderStatus.DONE, order.getStatus());
    }

    @Test
    void vendorPortionPaymentUnlocksAfterCustomerProblemWindow() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.releaseCodIfReady(order.getPlacedAt().plusMinutes(16));

        order.updateVendorStatus(supplier, VendorOrderStatus.OUT_FOR_DELIVERY);
        order.updateVendorStatus(supplier, VendorOrderStatus.DONE);
        order.setVendorFinancialReleaseAt(supplier, order.getVendorCompletedAt().get(supplier).plusMinutes(60));

        assertFalse(order.isVendorPortionFinanciallyEligible(supplier,
                order.getVendorCompletedAt().get(supplier).plusMinutes(59), 60));
        assertTrue(order.isVendorPortionFinanciallyEligible(supplier,
                order.getVendorCompletedAt().get(supplier).plusMinutes(60), 60));
    }

    @Test
    void adminCanInvalidateVendorPortionOnlyDuringProblemWindow() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.releaseCodIfReady(order.getPlacedAt().plusMinutes(16));
        order.updateVendorStatus(supplier, VendorOrderStatus.OUT_FOR_DELIVERY);
        order.updateVendorStatus(supplier, VendorOrderStatus.DONE);
        order.setVendorFinancialReleaseAt(supplier, order.getVendorCompletedAt().get(supplier).plusMinutes(60));

        UUID adminId = UUID.randomUUID();
        order.invalidateVendorPortion(supplier, adminId, "DAMAGED_ITEM", "Customer support confirmed damaged item",
                order.getVendorCompletedAt().get(supplier).plusMinutes(30), 60);

        assertTrue(order.isVendorPortionInvalid(supplier));
        assertEquals(adminId, order.getVendorInvalidatedBy().get(supplier));
        assertEquals("DAMAGED_ITEM", order.getVendorInvalidationReasons().get(supplier));
        assertFalse(order.isVendorPortionFinanciallyEligible(supplier,
                order.getVendorCompletedAt().get(supplier).plusMinutes(60), 60));
    }

    @Test
    void instapayVendorPayoutUsesExistingCommissionRateInReverse() {
        Commission payout = Commission.createVendorPayout(UUID.randomUUID(), UUID.randomUUID(),
                new BigDecimal("1000.00"), new BigDecimal("0.10"), java.time.LocalDateTime.now());

        assertEquals(CommissionDirection.PLATFORM_TO_VENDOR, payout.effectiveDirection());
        assertEquals(0, new BigDecimal("900.0000").compareTo(payout.getPayableAmount()));
    }

    @Test
    void guaranteedPayoutGrossesUpWhileCustomerPriceModeDeductsCommission() {
        CommissionPriceQuote protectedPayout = CommissionPriceQuote.calculate(new BigDecimal("100.00"),
                new BigDecimal("0.10"), VendorPricingMode.GUARANTEED_VENDOR_PAYOUT);
        CommissionPriceQuote fixedCustomerPrice = CommissionPriceQuote.calculate(new BigDecimal("100.00"),
                new BigDecimal("0.10"), VendorPricingMode.CUSTOMER_PRICE);
        CommissionPriceQuote percentInput = CommissionPriceQuote.calculate(new BigDecimal("100.00"),
                new BigDecimal("10"), VendorPricingMode.CUSTOMER_PRICE);

        assertEquals(new BigDecimal("111.11"), protectedPayout.customerPrice());
        assertEquals(new BigDecimal("100.00"), protectedPayout.vendorPayout());
        assertEquals(new BigDecimal("100.00"), fixedCustomerPrice.customerPrice());
        assertEquals(new BigDecimal("90.00"), fixedCustomerPrice.vendorPayout());
        assertEquals(new BigDecimal("10.00"), percentInput.commissionAmount());
        assertEquals(0, new BigDecimal("0.10").compareTo(percentInput.commissionRate()));
    }

    @Test
    void orderCommissionSnapshotCannotBeChangedAfterCheckout() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.snapshotCommissionRates(java.util.Map.of(supplier, new BigDecimal("0.10")), order.getPlacedAt());

        assertEquals(new BigDecimal("0.10"), order.getCommissionRateFor(supplier));
        assertEquals(new BigDecimal("100"), order.getVendorSubtotalFor(supplier));
        assertEquals(new BigDecimal("10.00"), order.getVendorCommissionAmountFor(supplier));
        assertThrows(IllegalStateException.class, () -> order.snapshotCommissionRates(
                java.util.Map.of(supplier, new BigDecimal("0.20")), order.getPlacedAt().plusMinutes(1)));
    }

    @Test
    void orderCommissionSnapshotTreatsHumanPercentInputAsPercent() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);

        order.snapshotCommissionRates(java.util.Map.of(supplier, new BigDecimal("10")), order.getPlacedAt());

        assertEquals(0, new BigDecimal("0.10").compareTo(order.getCommissionRateFor(supplier)));
        assertEquals(new BigDecimal("10.00"), order.getVendorCommissionAmountFor(supplier));
    }

    @Test
    void invalidationRequiresReasonDetailsAndAdmin() {
        UUID supplier = UUID.randomUUID();
        Order order = Order.place(UUID.randomUUID(), "Customer", "c@example.com",
                List.of(item(supplier, "100")), "Address", "COD", null,
                null, null, 15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.releaseCodIfReady(order.getPlacedAt().plusMinutes(16));
        order.updateVendorStatus(supplier, VendorOrderStatus.OUT_FOR_DELIVERY);
        order.updateVendorStatus(supplier, VendorOrderStatus.DONE);
        order.setVendorFinancialReleaseAt(supplier, order.getVendorCompletedAt().get(supplier).plusMinutes(60));

        assertThrows(IllegalArgumentException.class, () -> order.invalidateVendorPortion(supplier,
                null, "DAMAGED_ITEM", "Confirmed by support",
                order.getVendorCompletedAt().get(supplier).plusMinutes(30), 60));
        assertThrows(IllegalArgumentException.class, () -> order.invalidateVendorPortion(supplier,
                UUID.randomUUID(), "", "Confirmed by support",
                order.getVendorCompletedAt().get(supplier).plusMinutes(30), 60));
        assertThrows(IllegalArgumentException.class, () -> order.invalidateVendorPortion(supplier,
                UUID.randomUUID(), "DAMAGED_ITEM", " ",
                order.getVendorCompletedAt().get(supplier).plusMinutes(30), 60));
    }
}

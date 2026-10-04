package com.giftastic.giftastic.modules.commission.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.giftastic.giftastic.common.config.OrderFlowConfig;
import com.giftastic.giftastic.modules.admin.repository.AdminRepository;
import com.giftastic.giftastic.modules.commission.domain.Commission;
import com.giftastic.giftastic.modules.commission.domain.CommissionDirection;
import com.giftastic.giftastic.modules.commission.domain.CommissionStatus;
import com.giftastic.giftastic.modules.commission.dto.CommissionDTO;
import com.giftastic.giftastic.modules.commission.repository.CommissionRepository;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;
import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

class CommissionServiceTests {

    private CommissionRepository commissionRepository;
    private VendorRepository vendorRepository;
    private OrderRepository orderRepository;
    private CommissionService service;
    private Map<String, Commission> stored;
    private Map<UUID, Order> orders;

    @BeforeEach
    void setUp() {
        commissionRepository = mock(CommissionRepository.class);
        vendorRepository = mock(VendorRepository.class);
        orderRepository = mock(OrderRepository.class);
        OrderFlowConfig orderFlowConfig = new OrderFlowConfig();
        orderFlowConfig.setCustomerProblemWindowMinutes(14 * 24 * 60);
        service = new CommissionService(
                commissionRepository,
                vendorRepository,
                mock(NotificationService.class),
                mock(AdminRepository.class),
                mock(CommissionPricingService.class),
                orderRepository,
                orderFlowConfig);
        stored = new HashMap<>();
        orders = new HashMap<>();

        when(commissionRepository.findByOrderIdAndSupplierId(any(UUID.class), any(UUID.class)))
                .thenAnswer(invocation -> Optional.ofNullable(stored.get(key(
                        invocation.getArgument(0), invocation.getArgument(1)))));
        when(commissionRepository.save(any(Commission.class))).thenAnswer(invocation -> {
            Commission commission = invocation.getArgument(0);
            stored.put(key(commission.getOrderId(), commission.getSupplierId()), commission);
            return commission;
        });
        when(commissionRepository.findUnpaidOrderByDueDateAsc()).thenAnswer(invocation -> stored.values().stream()
                .filter(commission -> commission.getStatus() == CommissionStatus.PENDING
                        || commission.getStatus() == CommissionStatus.OVERDUE)
                .toList());
        when(commissionRepository.findByDirectionOrderByCreatedAtDesc(CommissionDirection.PLATFORM_TO_VENDOR))
                .thenAnswer(invocation -> stored.values().stream()
                        .filter(commission -> commission.effectiveDirection() == CommissionDirection.PLATFORM_TO_VENDOR)
                        .toList());
        when(orderRepository.findById(any(UUID.class)))
                .thenAnswer(invocation -> Optional.ofNullable(orders.get(invocation.getArgument(0))));
        when(vendorRepository.findBySupplierId(any(UUID.class))).thenReturn(Optional.empty());
    }

    @Test
    void codEligibilityCreatesVendorToPlatformCommissionOnly() {
        UUID supplierId = UUID.randomUUID();
        Order order = newOrder("COD", supplierId, false);
        LocalDateTime now = LocalDateTime.now();
        completeVendorPortion(order, supplierId, now.minusDays(15));

        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now);

        assertEquals(1, stored.size());
        Commission commission = stored.values().iterator().next();
        assertEquals(CommissionDirection.VENDOR_TO_PLATFORM, commission.effectiveDirection());
        assertEquals(1, service.getAllUnpaidCommissions().size());
        assertEquals(0, service.getEligibleInstapayPayouts().size());
    }

    @Test
    void confirmedInstapayWaitsForCompletionAndFourteenDayWindowThenAppearsOnce() {
        UUID supplierId = UUID.randomUUID();
        Order order = newOrder("INSTAPAY", supplierId, true);
        LocalDateTime now = LocalDateTime.now();

        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now);
        assertEquals(0, stored.size());

        completeVendorPortion(order, supplierId, now);
        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now.plusDays(13));
        assertEquals(0, stored.size());

        LocalDateTime completedAt = now.minusDays(15);
        order.getVendorCompletedAt().put(supplierId, completedAt);
        order.setVendorFinancialReleaseAt(supplierId, completedAt.plusDays(14));
        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now);
        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now);

        assertEquals(1, stored.size());
        verify(commissionRepository, times(1)).save(any(Commission.class));
        List<CommissionDTO> payouts = service.getEligibleInstapayPayouts();
        assertEquals(1, payouts.size());
        assertEquals(CommissionDirection.PLATFORM_TO_VENDOR, payouts.get(0).direction());
        assertEquals(CommissionStatus.PENDING, payouts.get(0).status());
        assertEquals(new BigDecimal("100.00"), payouts.get(0).orderSubtotal());
        assertEquals(new BigDecimal("10.00"), payouts.get(0).commissionAmount());
        assertEquals(new BigDecimal("90.00"), payouts.get(0).payableAmount());
        assertEquals(order.getPlacedAt(), payouts.get(0).orderPlacedAt());
        assertEquals(completedAt, payouts.get(0).completedAt());
        assertEquals(0, service.getAllUnpaidCommissions().size());
    }

    @Test
    void unconfirmedInstapayDoesNotCreatePayoutEvenAfterVendorWindow() {
        UUID supplierId = UUID.randomUUID();
        Order order = newOrder("INSTAPAY", supplierId, false);
        order.getVendorStatuses().put(supplierId, VendorOrderStatus.IN_PROGRESS);
        order.setStatus(OrderStatus.IN_PROGRESS);
        LocalDateTime now = LocalDateTime.now();
        completeVendorPortion(order, supplierId, now.minusDays(15));

        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now);

        assertEquals(0, stored.size());
    }

    @Test
    void invalidInstapayVendorPortionNeverCreatesPayout() {
        UUID supplierId = UUID.randomUUID();
        Order order = newOrder("INSTAPAY", supplierId, true);
        LocalDateTime now = LocalDateTime.now();
        completeVendorPortion(order, supplierId, now.minusDays(1));
        order.invalidateVendorPortion(supplierId, UUID.randomUUID(), "REFUND", "Refund approved",
                now, 14 * 24 * 60);

        service.createCommissionForSuccessfulVendorPortion(order, supplierId, now.plusDays(15));

        assertEquals(0, stored.size());
    }

    private Order newOrder(String paymentMethod, UUID supplierId, boolean confirmInstapay) {
        OrderItem item = new OrderItem(UUID.randomUUID(), "Gift", null, 1, new BigDecimal("100.00"),
                supplierId, null, null);
        Order order = Order.place(UUID.randomUUID(), "Customer", "customer@example.com", List.of(item),
                "Address", paymentMethod, "INSTAPAY".equals(paymentMethod) ? "01015457241" : null,
                "INSTAPAY".equals(paymentMethod) ? "01000000000" : null,
                "INSTAPAY".equals(paymentMethod) ? "Customer" : null,
                15, UUID.randomUUID(), BigDecimal.ZERO, null);
        order.snapshotCommissionRates(Map.of(supplierId, new BigDecimal("0.10")), order.getPlacedAt());
        if ("COD".equals(paymentMethod)) {
            order.releaseCodIfReady(order.getPlacedAt().plusMinutes(16));
        } else if (confirmInstapay) {
            order.submitInstapayTransactionIds(List.of("transaction-1"));
            order.confirmInstapayPayment(UUID.randomUUID(), order.getPlacedAt().plusMinutes(1));
        }
        orders.put(order.getId(), order);
        return order;
    }

    private static void completeVendorPortion(Order order, UUID supplierId, LocalDateTime completedAt) {
        order.updateVendorStatus(supplierId, VendorOrderStatus.OUT_FOR_DELIVERY);
        order.updateVendorStatus(supplierId, VendorOrderStatus.DONE);
        order.getVendorCompletedAt().put(supplierId, completedAt);
        order.setVendorFinancialReleaseAt(supplierId, completedAt.plusDays(14));
    }

    private static String key(UUID orderId, UUID supplierId) {
        return orderId + ":" + supplierId;
    }
}

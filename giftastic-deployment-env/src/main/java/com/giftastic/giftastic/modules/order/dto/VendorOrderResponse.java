package com.giftastic.giftastic.modules.order.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;
import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;

public record VendorOrderResponse(
        UUID id,
        OrderStatus status,
        List<OrderItem> items,
        LocalDateTime placedAt,
        String shippingAddress,
        String customerName,
        String customerEmail,
        String customerPhone,
        String paymentMethod,
        Map<UUID, VendorOrderStatus> vendorStatuses,
        Map<UUID, LocalDateTime> vendorCompletedAt,
        Map<UUID, LocalDateTime> vendorFinancialReleaseAt,
        LocalDateTime estimatedDeliveryDate,
        String deliveryNotes) {

    public static VendorOrderResponse from(Order order, UUID supplierId) {
        return from(order, supplierId, order.getGuestInfo() == null ? null : order.getGuestInfo().getPhone());
    }

    public static VendorOrderResponse from(Order order, UUID supplierId, String customerPhone) {
        List<OrderItem> vendorItems = order.getItems().stream()
                .filter(item -> supplierId.equals(item.getSupplierId())).toList();
        VendorOrderStatus vendorStatus = order.getVendorStatuses().get(supplierId);
        return new VendorOrderResponse(order.getId(), order.getStatus(), vendorItems, order.getPlacedAt(),
                order.getShippingAddress(), order.getCustomerName(), order.getCustomerEmail(),
                customerPhone, order.getPaymentMethod(), vendorStatus == null ? Map.of() : Map.of(supplierId, vendorStatus),
                order.getVendorCompletedAt().containsKey(supplierId) ? Map.of(supplierId, order.getVendorCompletedAt().get(supplierId)) : Map.of(),
                order.getVendorFinancialReleaseAt().containsKey(supplierId) ? Map.of(supplierId, order.getVendorFinancialReleaseAt().get(supplierId)) : Map.of(),
                order.getEstimatedDeliveryDate(), order.getDeliveryNotes());
    }
}

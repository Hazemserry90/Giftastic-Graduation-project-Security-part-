package com.giftastic.giftastic.modules.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.giftastic.giftastic.common.config.OrderFlowConfig;
import com.giftastic.giftastic.common.config.PaymentConfig;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;
import com.giftastic.giftastic.modules.cart.service.CartService;
import com.giftastic.giftastic.modules.commission.service.CommissionPricingService;
import com.giftastic.giftastic.modules.commission.service.CommissionService;
import com.giftastic.giftastic.modules.delivery.service.DeliveryService;
import com.giftastic.giftastic.modules.notification.service.NotificationService;
import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderItem;
import com.giftastic.giftastic.modules.order.repository.OrderRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.product.service.ProductService;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.service.UserService;
import com.giftastic.giftastic.modules.vendor.service.VendorActivityService;

@ExtendWith(MockitoExtension.class)
class OrderServiceInstapayPreferenceTests {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductService productService;
    @Mock private ProductRepository productRepository;
    @Mock private CartService cartService;
    @Mock private NotificationService notificationService;
    @Mock private UserService userService;
    @Mock private DeliveryService deliveryService;
    @Mock private VendorActivityService vendorActivityService;
    @Mock private CommissionService commissionService;
    @Mock private PaymentConfig paymentConfig;
    @Mock private OrderFlowConfig orderFlowConfig;
    @Mock private CommissionPricingService commissionPricingService;
    @Mock private Product product;

    @InjectMocks
    private OrderServiceImpl orderService;

    private final UUID customerId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID supplierId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        User user = User.create("customer@example.com", "hash");
        user.setId(customerId);
        when(userService.getById(customerId)).thenReturn(user);
        when(productService.getOrThrow(productId)).thenReturn(product);
        when(product.hasStock(1)).thenReturn(true);
        when(product.getSupplierId()).thenReturn(supplierId);
        when(product.getDiscountedPrice()).thenReturn(new BigDecimal("100.00"));
        when(product.getEffectivePricingMode()).thenReturn(VendorPricingMode.CUSTOMER_PRICE);
        when(product.getName()).thenReturn("Gift");
        when(product.getImages()).thenReturn(List.of());
        when(commissionPricingService.getApplicableRate(any(), any())).thenReturn(new BigDecimal("0.10"));
        when(orderFlowConfig.getCancelGracePeriodMinutes()).thenReturn(15);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void successfulInstapayOrderPersistsRefundPreferenceWithoutTransactionIds() {
        PaymentConfig.Instapay instapay = new PaymentConfig.Instapay();
        instapay.setPhoneNumber("01015457241");
        when(paymentConfig.getInstapay()).thenReturn(instapay);

        Order order = placeOrder("INSTAPAY", " 01000000000 ", " Account Holder ");

        verify(userService).updateInstapayRefundDetails(customerId, "01000000000", "Account Holder");
        assertEquals(" 01000000000 ", order.getInstapayRefundPhoneNumber());
        assertEquals(" Account Holder ", order.getInstapayRefundName());
        assertTrue(order.getInstapayTransactionIds().isEmpty());
    }

    @Test
    void codOrderDoesNotChangeInstapayRefundPreference() {
        placeOrder("COD", null, null);

        verify(userService, never()).updateInstapayRefundDetails(any(), any(), any());
    }

    private Order placeOrder(String paymentMethod, String refundPhone, String refundName) {
        OrderItem item = new OrderItem(productId, "Gift", null, 1, BigDecimal.ONE,
                supplierId, null, null);
        return orderService.placeOrder(customerId, "Customer", "customer@example.com",
                List.of(item), "Address", paymentMethod, null, refundPhone, refundName, null);
    }
}

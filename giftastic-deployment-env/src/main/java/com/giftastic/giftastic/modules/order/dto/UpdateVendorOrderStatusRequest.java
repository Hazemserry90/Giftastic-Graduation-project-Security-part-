package com.giftastic.giftastic.modules.order.dto;

import com.giftastic.giftastic.modules.order.domain.VendorOrderStatus;

public record UpdateVendorOrderStatusRequest(VendorOrderStatus status) {}

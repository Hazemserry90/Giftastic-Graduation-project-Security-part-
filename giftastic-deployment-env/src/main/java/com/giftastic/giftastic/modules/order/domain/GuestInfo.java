package com.giftastic.giftastic.modules.order.domain;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class GuestInfo {
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String shippingAddress;
}

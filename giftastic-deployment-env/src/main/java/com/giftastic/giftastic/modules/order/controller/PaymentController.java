package com.giftastic.giftastic.modules.order.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.common.config.PaymentConfig;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment configuration endpoints")
public class PaymentController {

    private final PaymentConfig paymentConfig;

    @GetMapping("/instapay/phone")
    public ResponseEntity<InstapayPhoneResponse> getInstapayPhone() {
        return ResponseEntity.ok(new InstapayPhoneResponse(paymentConfig.getInstapay().getPhoneNumber()));
    }
    
    public record InstapayPhoneResponse(String phoneNumber) {}
}

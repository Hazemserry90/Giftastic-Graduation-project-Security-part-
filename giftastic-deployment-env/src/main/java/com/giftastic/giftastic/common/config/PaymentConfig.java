package com.giftastic.giftastic.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentConfig {
    private Instapay instapay = new Instapay();
    
    @Getter
    @Setter
    public static class Instapay {
        private String phoneNumber;
    }
}

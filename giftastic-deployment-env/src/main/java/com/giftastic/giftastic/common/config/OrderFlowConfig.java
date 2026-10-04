package com.giftastic.giftastic.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "order-flow")
@Getter
@Setter
public class OrderFlowConfig {
    private int cancelGracePeriodMinutes = 15;
    private int customerProblemWindowMinutes = 20160;
    private int maxGiftFlowsPerVendor = 10;
    private int maxGiftFlowSteps = 5;
}

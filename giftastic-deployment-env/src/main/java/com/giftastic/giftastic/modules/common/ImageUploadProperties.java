package com.giftastic.giftastic.modules.common;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "upload-limits.images")
public class ImageUploadProperties {

    private long maxImageBytes = 10L * 1024L * 1024L;
    private long maxVendorStorageBytes = 1_288_490_188L;
    private int maxProductImages = 6;
    private int maxVendorProfileImages = 8;
    private int maxGiftFlowImages = 1;
    private int maxVendorTotalImages = 80;
}

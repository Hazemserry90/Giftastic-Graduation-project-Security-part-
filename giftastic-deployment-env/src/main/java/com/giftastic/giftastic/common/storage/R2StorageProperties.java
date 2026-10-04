package com.giftastic.giftastic.common.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "storage.r2")
public class R2StorageProperties {

    private String accountId;
    private String accessKeyId;
    private String secretAccessKey;
    private String bucketName;
    private String publicUrl;

    public String endpoint() {
        return "https://" + accountId + ".r2.cloudflarestorage.com";
    }

    public String publicUrlFor(String objectKey) {
        String base = publicUrl == null ? "" : publicUrl.replaceAll("/+$", "");
        return base + "/" + objectKey;
    }

    public void validateConfigured() {
        if (isBlank(accountId) || isBlank(accessKeyId) || isBlank(secretAccessKey)
                || isBlank(bucketName) || isBlank(publicUrl)) {
            throw new IllegalStateException("Cloudflare R2 storage is not configured.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

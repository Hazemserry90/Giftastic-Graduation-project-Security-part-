package com.giftastic.giftastic.modules.vendor.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vendor_profile_images", indexes = {
    @jakarta.persistence.Index(name = "idx_vendor_profile_image_vendor", columnList = "vendorId")
})
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class VendorProfileImage {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorProfileImageType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String objectKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    private String filename;

    private String mimeType;

    private long sizeBytes;

    private int sortOrder;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public VendorProfileImage(
            UUID id,
            UUID vendorId,
            VendorProfileImageType type,
            String objectKey,
            String url,
            String filename,
            String mimeType,
            long sizeBytes,
            int sortOrder,
            LocalDateTime createdAt) {
        this.id = id;
        this.vendorId = vendorId;
        this.type = type;
        this.objectKey = objectKey;
        this.url = url;
        this.filename = filename;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    public void updateSortOrder(int sortOrder) {
        if (sortOrder < 0) {
            throw new IllegalArgumentException("Sort order must be zero or greater.");
        }
        this.sortOrder = sortOrder;
    }
}

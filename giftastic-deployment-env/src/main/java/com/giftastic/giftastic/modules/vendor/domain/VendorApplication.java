package com.giftastic.giftastic.modules.vendor.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "vendor_applications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VendorApplication {

    @Id
    @NonNull
    private UUID id;

    @Column(nullable = false)
    @NonNull
    private UUID userId;

    @Column(nullable = false)
    @NonNull
    private String storeName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String bannerUrl;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String websiteUrl;
    private String instagramUrl;
    private String facebookUrl;
    private String workingHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private VendorApplicationStatus status;

    @Column(nullable = false)
    @NonNull
    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private UUID reviewedBy;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private VendorApplication(UUID id, UUID userId, String storeName, String description,
                             String logoUrl, String bannerUrl, String contactEmail, String contactPhone,
                             String address, String websiteUrl, String instagramUrl, String facebookUrl,
                             String workingHours) {
        this.id = id;
        this.userId = userId;
        this.storeName = storeName;
        this.description = description;
        this.logoUrl = logoUrl;
        this.bannerUrl = bannerUrl;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.address = address;
        this.websiteUrl = websiteUrl;
        this.instagramUrl = instagramUrl;
        this.facebookUrl = facebookUrl;
        this.workingHours = workingHours;
        this.status = VendorApplicationStatus.PENDING;
        this.submittedAt = LocalDateTime.now();
    }

    public static VendorApplication submit(UUID userId, String storeName, String description,
                                          String logoUrl, String bannerUrl, String contactEmail, String contactPhone,
                                          String address, String websiteUrl, String instagramUrl, String facebookUrl,
                                          String workingHours) {
        if (storeName == null || storeName.isBlank()) {
            throw new IllegalArgumentException("Store name is required");
        }
        
        return new VendorApplication(
            UUID.randomUUID(),
            userId,
            storeName,
            description,
            logoUrl,
            bannerUrl,
            contactEmail,
            contactPhone,
            address,
            websiteUrl,
            instagramUrl,
            facebookUrl,
            workingHours
        );
    }

    public void approve(UUID reviewerId) {
        if (this.status != VendorApplicationStatus.PENDING) {
            throw new IllegalStateException("Only pending applications can be approved");
        }
        this.status = VendorApplicationStatus.APPROVED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
    }

    public void reject(UUID reviewerId, String reason) {
        if (this.status != VendorApplicationStatus.PENDING) {
            throw new IllegalStateException("Only pending applications can be rejected");
        }
        this.status = VendorApplicationStatus.REJECTED;
        this.reviewedAt = LocalDateTime.now();
        this.reviewedBy = reviewerId;
        this.rejectionReason = reason;
    }
}

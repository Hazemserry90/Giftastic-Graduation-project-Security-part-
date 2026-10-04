package com.giftastic.giftastic.modules.vendor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.UUID;

@Entity
@Table(name = "vendors")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED) // Required by JPA
public class Vendor {

    @Id
    @NonNull
    private UUID userId; // PK is the User ID

    @Column(nullable = false, unique = true)
    @NonNull
    private UUID supplierId; // Business identifier

    @Column(nullable = false)
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

    @Column(nullable = false)
    private boolean isVerified;

    public Vendor(UUID userId, UUID supplierId, String storeName, boolean isVerified) {
        this.userId = userId;
        this.supplierId = supplierId;
        this.storeName = storeName;
        this.isVerified = isVerified;
    }

    public void verify() {
        this.isVerified = true;
    }

    public void deactivate() {
        this.isVerified = false;
    }

    public void update(String storeName, String description, String logoUrl, String bannerUrl, 
                       String contactEmail, String contactPhone, String address, 
                       String websiteUrl, String instagramUrl, String facebookUrl, String workingHours) {
        if (contactPhone != null && !contactPhone.isBlank() && !contactPhone.matches("[0-9]+")) {
            throw new IllegalArgumentException("Contact phone must contain numbers only");
        }
        if (storeName != null && !storeName.isBlank()) {
            this.storeName = storeName;
        }
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
    }

    public void updateProfileImage(VendorProfileImageType type, String url) {
        if (type == VendorProfileImageType.LOGO) {
            this.logoUrl = url;
        } else if (type == VendorProfileImageType.BANNER) {
            this.bannerUrl = url;
        }
    }
}

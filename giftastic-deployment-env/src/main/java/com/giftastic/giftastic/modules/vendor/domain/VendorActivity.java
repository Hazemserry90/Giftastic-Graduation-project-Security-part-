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
@Table(name = "vendor_activities")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VendorActivity {
    
    @Id
    @NonNull
    private UUID id;
    
    @Column(nullable = false)
    @NonNull
    private UUID vendorId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NonNull
    private VendorActivityType activityType;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    @NonNull
    private String description;
    
    private UUID relatedEntityId;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @Column(nullable = false)
    @NonNull
    private LocalDateTime occurredAt;
    
    private VendorActivity(UUID id, UUID vendorId, VendorActivityType activityType, 
                          String description, UUID relatedEntityId, String metadata) {
        this.id = id;
        this.vendorId = vendorId;
        this.activityType = activityType;
        this.description = description;
        this.relatedEntityId = relatedEntityId;
        this.metadata = metadata;
        this.occurredAt = LocalDateTime.now();
    }
    
    public static VendorActivity log(UUID vendorId, VendorActivityType activityType, 
                                    String description, UUID relatedEntityId, String metadata) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Description cannot be blank");
        }
        return new VendorActivity(UUID.randomUUID(), vendorId, activityType, 
                                 description, relatedEntityId, metadata);
    }
}

package com.giftastic.giftastic.modules.delivery.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "delivery_zones")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeliveryZone {
    
    @Id
    @NonNull
    private UUID id;
    
    @Column(nullable = false, unique = true)
    @NonNull
    private String zoneName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private boolean isActive;
    
    private DeliveryZone(UUID id, String zoneName, String description) {
        this.id = id;
        this.zoneName = zoneName;
        this.description = description;
        this.isActive = true;
    }
    
    public static DeliveryZone create(String zoneName, String description) {
        if (zoneName == null || zoneName.isBlank()) {
            throw new IllegalArgumentException("Zone name cannot be blank");
        }
        return new DeliveryZone(UUID.randomUUID(), zoneName, description);
    }
    
    public void deactivate() {
        this.isActive = false;
    }
    
    public void activate() {
        this.isActive = true;
    }
}

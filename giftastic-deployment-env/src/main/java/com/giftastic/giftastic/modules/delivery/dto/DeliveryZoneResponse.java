package com.giftastic.giftastic.modules.delivery.dto;

import java.util.UUID;

import com.giftastic.giftastic.modules.delivery.domain.DeliveryZone;

public record DeliveryZoneResponse(
    UUID id,
    String zoneName,
    String description,
    boolean isActive
) {
    public static DeliveryZoneResponse from(DeliveryZone zone) {
        return new DeliveryZoneResponse(
            zone.getId(),
            zone.getZoneName(),
            zone.getDescription(),
            zone.isActive()
        );
    }
}

package com.giftastic.giftastic.modules.delivery.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.delivery.domain.DeliveryZone;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, UUID> {
    List<DeliveryZone> findByIsActiveTrue();
    Optional<DeliveryZone> findByZoneName(String zoneName);
}

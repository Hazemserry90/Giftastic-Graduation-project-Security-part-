package com.giftastic.giftastic.modules.delivery.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.giftastic.giftastic.modules.delivery.domain.DeliveryZone;
import com.giftastic.giftastic.modules.delivery.repository.DeliveryZoneRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Order(2) // Run after DatabaseSchemaUpdater
@RequiredArgsConstructor
@Slf4j
public class DeliveryZoneInitializer implements CommandLineRunner {

    private final DeliveryZoneRepository deliveryZoneRepository;

    @Override
    public void run(String... args) {
        if (deliveryZoneRepository.count() > 0) {
            log.info("Delivery zones already initialized. Skipping...");
            return;
        }

        log.info("Initializing Alexandria delivery zones...");

        List<DeliveryZone> zones = List.of(
            createZone("Sidi Gaber", "Sidi Gaber area"),
            createZone("Smouha", "Smouha district"),
            createZone("Stanley", "Stanley beach area"),
            createZone("Glim", "Glim area"),
            createZone("Sporting", "Sporting district"),
            createZone("Roushdy", "Roushdy area"),
            createZone("Louran", "Louran district"),
            createZone("San Stefano", "San Stefano area"),
            createZone("Sidi Bishr", "Sidi Bishr district"),
            createZone("Miami", "Miami beach area"),
            createZone("Asafra", "Asafra area"),
            createZone("Mandara", "Mandara district"),
            createZone("Montaza", "Montaza palace area"),
            createZone("Maamoura", "Maamoura beach"),
            createZone("Abou Qir", "Abou Qir area"),
            createZone("Kafr Abdo", "Kafr Abdo district"),
            createZone("Cleopatra", "Cleopatra area"),
            createZone("Bolkly", "Bolkly district"),
            createZone("Camp Caesar", "Camp Caesar area"),
            createZone("Shatby", "Shatby district"),
            createZone("Azarita", "Azarita area"),
            createZone("Raml Station", "Raml Station area"),
            createZone("Mansheya", "Mansheya district"),
            createZone("Attarin", "Attarin area"),
            createZone("Anfushi", "Anfushi district"),
            createZone("Ras El Tin", "Ras El Tin area"),
            createZone("Gomrok", "Gomrok district"),
            createZone("Karmouz", "Karmouz area"),
            createZone("Moharram Bek", "Moharram Bek district"),
            createZone("Ibrahimiya", "Ibrahimiya area"),
            createZone("Fleming", "Fleming district"),
            createZone("Victoria", "Victoria area"),
            createZone("Bacchus", "Bacchus district"),
            createZone("Schutz", "Schutz area"),
            createZone("Zezenia", "Zezenia district"),
            createZone("Saba Pasha", "Saba Pasha area"),
            createZone("Agami", "Agami beach area")
        );

        deliveryZoneRepository.saveAll(zones);
        log.info("Successfully initialized {} delivery zones", zones.size());
    }

    private DeliveryZone createZone(String name, String description) {
        return DeliveryZone.create(name, description);
    }
}

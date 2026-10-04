package com.giftastic.giftastic.common.persistence;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("[DatabaseMigrationRunner] Running startup migrations...");
        try {
            // Relax constraints for guest checkout: drop NOT NULL on customer_id in orders
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;");
            log.info("[DatabaseMigrationRunner] Successfully altered orders table to drop NOT NULL constraint on customer_id");
        } catch (Exception e) {
            log.warn("[DatabaseMigrationRunner] Migration warning or already applied: {}", e.getMessage());
        }
    }
}

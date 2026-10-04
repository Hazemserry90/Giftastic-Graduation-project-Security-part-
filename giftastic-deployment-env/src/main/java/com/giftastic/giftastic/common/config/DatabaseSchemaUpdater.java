package com.giftastic.giftastic.common.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Order(1) // Run before DeliveryZoneInitializer
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaUpdater implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Checking database schema for required updates...");
        
        // Add stock_quantity column if it doesn't exist
        addStockQuantityColumn();
        
        // Add delivery zone columns to orders if they don't exist
        addDeliveryZoneColumns();
        
        // Add discount columns to products
        addDiscountColumns();
        
        // Add delivery estimate columns to orders
        addDeliveryEstimateColumns();

        addInstapayRefundColumns();
        
        log.info("Database schema check completed");
    }

    private void addStockQuantityColumn() {
        try {
            // Check if column exists
            String checkSql = "SELECT column_name FROM information_schema.columns " +
                             "WHERE table_name = 'products' AND column_name = 'stock_quantity'";
            
            var result = jdbcTemplate.queryForList(checkSql, String.class);
            
            if (result.isEmpty()) {
                log.info("Adding stock_quantity column to products table...");
                jdbcTemplate.execute("ALTER TABLE products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0");
                log.info("Successfully added stock_quantity column");
            } else {
                log.info("stock_quantity column already exists - skipping");
            }
        } catch (Exception e) {
            log.error("Failed to add stock_quantity column: {}", e.getMessage(), e);
        }
    }

    private void addDeliveryZoneColumns() {
        try {
            // Check if delivery_zone_id column exists
            String checkSql = "SELECT column_name FROM information_schema.columns " +
                             "WHERE table_name = 'orders' AND column_name = 'delivery_zone_id'";
            
            var result = jdbcTemplate.queryForList(checkSql, String.class);
            
            if (result.isEmpty()) {
                log.info("Adding delivery zone columns to orders table...");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN delivery_zone_id UUID");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN delivery_cost DECIMAL(10, 2)");
                log.info("Successfully added delivery zone columns");
            } else {
                log.info("Delivery zone columns already exist - skipping");
            }
        } catch (Exception e) {
            log.error("Failed to add delivery zone columns: {}", e.getMessage(), e);
        }
    }
    
    private void addDiscountColumns() {
        try {
            String checkSql = "SELECT column_name FROM information_schema.columns " +
                             "WHERE table_name = 'products' AND column_name = 'discount_percentage'";
            
            var result = jdbcTemplate.queryForList(checkSql, String.class);
            
            if (result.isEmpty()) {
                log.info("Adding discount columns to products table...");
                jdbcTemplate.execute("ALTER TABLE products ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE products ADD COLUMN discount_start_date TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE products ADD COLUMN discount_end_date TIMESTAMP");
                log.info("Successfully added discount columns");
            } else {
                log.info("Discount columns already exist - skipping");
            }
        } catch (Exception e) {
            log.error("Failed to add discount columns: {}", e.getMessage(), e);
        }
    }
    
    private void addDeliveryEstimateColumns() {
        try {
            String checkSql = "SELECT column_name FROM information_schema.columns " +
                             "WHERE table_name = 'orders' AND column_name = 'estimated_delivery_date'";
            
            var result = jdbcTemplate.queryForList(checkSql, String.class);
            
            if (result.isEmpty()) {
                log.info("Adding delivery estimate columns to orders table...");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN estimated_delivery_date TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN actual_delivery_date TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN delivery_notes TEXT");
                log.info("Successfully added delivery estimate columns");
            } else {
                log.info("Delivery estimate columns already exist - skipping");
            }
        } catch (Exception e) {
            log.error("Failed to add delivery estimate columns: {}", e.getMessage(), e);
        }
    }

    private void addInstapayRefundColumns() {
        addColumnIfMissing("users", "instapay_refund_phone_number", "ALTER TABLE users ADD COLUMN instapay_refund_phone_number VARCHAR(255)");
        addColumnIfMissing("users", "instapay_refund_name", "ALTER TABLE users ADD COLUMN instapay_refund_name VARCHAR(255)");
        addColumnIfMissing("orders", "instapay_refund_phone_number", "ALTER TABLE orders ADD COLUMN instapay_refund_phone_number VARCHAR(255)");
        addColumnIfMissing("orders", "instapay_refund_name", "ALTER TABLE orders ADD COLUMN instapay_refund_name VARCHAR(255)");
    }

    private void addColumnIfMissing(String tableName, String columnName, String ddl) {
        try {
            String checkSql = "SELECT column_name FROM information_schema.columns " +
                    "WHERE table_name = ? AND column_name = ?";
            var result = jdbcTemplate.queryForList(checkSql, String.class, tableName, columnName);
            if (result.isEmpty()) {
                log.info("Adding {} column to {} table...", columnName, tableName);
                jdbcTemplate.execute(ddl);
            }
        } catch (Exception e) {
            log.error("Failed to add {}.{}: {}", tableName, columnName, e.getMessage(), e);
        }
    }
}

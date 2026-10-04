package com.giftastic.giftastic.modules.order.config;

import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.giftastic.giftastic.modules.order.domain.OrderStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class OrderDatabaseSchemaUpdater implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        syncOrderStatusConstraint();
        createInstapayPaymentMessagesTable();
    }

    private void syncOrderStatusConstraint() {
        try {
            String allowedStatuses = Arrays.stream(OrderStatus.values())
                    .map(status -> "'" + status.name() + "'")
                    .collect(Collectors.joining(", "));
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;");
            jdbcTemplate.execute("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (" + allowedStatuses + ")) NOT VALID;");
            log.info("Synced orders_status_check with OrderStatus enum");
        } catch (Exception e) {
            log.error("Could not sync orders_status_check: {}", e.getMessage(), e);
        }
    }

    private void createInstapayPaymentMessagesTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS order_instapay_payment_messages (
                    order_id UUID NOT NULL,
                    message_index INTEGER NOT NULL,
                    sender_role VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    sent_at TIMESTAMP NOT NULL,
                    PRIMARY KEY (order_id, message_index)
                );
                """);
            log.info("Ensured order_instapay_payment_messages table exists");
        } catch (Exception e) {
            log.error("Could not create order_instapay_payment_messages table: {}", e.getMessage(), e);
        }
    }
}

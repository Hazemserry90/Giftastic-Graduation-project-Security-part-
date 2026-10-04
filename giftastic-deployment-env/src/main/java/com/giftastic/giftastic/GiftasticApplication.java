package com.giftastic.giftastic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GiftasticApplication {

	public static void main(String[] args) {
		SpringApplication.run(GiftasticApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner schemaFixer(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				jdbcTemplate.execute("ALTER TABLE admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_permission_check");
			} catch (Exception e) {
				// Ignore if table or constraint doesn't exist
			}
		};
	}
}

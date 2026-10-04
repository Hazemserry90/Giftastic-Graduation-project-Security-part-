package com.giftastic.giftastic.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.giftastic.giftastic.modules.category.repository.CategoryRepository;
import com.giftastic.giftastic.modules.category.domain.Category;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner initDatabase(CategoryRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(Category.create("Electronics"));
                repository.save(Category.create("Clothing"));
                repository.save(Category.create("Jewelry"));
            }
        };
    }
}

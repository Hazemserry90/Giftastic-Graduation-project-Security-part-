package com.giftastic.giftastic.modules.category.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.giftastic.giftastic.modules.category.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID>{
    Category save(Category category);
}

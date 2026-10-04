package com.giftastic.giftastic.modules.category.dto;

import java.util.UUID;

import com.giftastic.giftastic.modules.category.domain.Category;

public record CategoryResponse(
        UUID id,
        UUID categoryId,
        String categoryName
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getCategoryId(), category.getCategoryName());
    }
}

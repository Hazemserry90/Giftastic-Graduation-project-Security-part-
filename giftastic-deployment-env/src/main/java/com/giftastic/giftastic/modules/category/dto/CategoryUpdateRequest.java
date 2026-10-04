package com.giftastic.giftastic.modules.category.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryUpdateRequest(
        @NotBlank(message = "Category name can't be empty") String categoryName
) {}

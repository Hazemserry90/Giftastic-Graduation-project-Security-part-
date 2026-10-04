package com.giftastic.giftastic.modules.category.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryCreateRequest(
        @NotBlank(message = "Category name can't be empty") String categoryName
) {}

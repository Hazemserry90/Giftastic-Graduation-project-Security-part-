package com.giftastic.giftastic.modules.product.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

public record ReorderProductImagesRequest(
    @NotEmpty List<UUID> imageIds
) {}

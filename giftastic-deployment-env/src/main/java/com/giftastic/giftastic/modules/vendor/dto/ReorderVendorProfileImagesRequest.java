package com.giftastic.giftastic.modules.vendor.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

public record ReorderVendorProfileImagesRequest(
    @NotEmpty List<UUID> imageIds
) {}

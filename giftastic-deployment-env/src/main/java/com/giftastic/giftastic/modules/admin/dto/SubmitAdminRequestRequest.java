package com.giftastic.giftastic.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitAdminRequestRequest(
    @NotBlank(message = "Message is required")
    @Size(min = 50, max = 1000, message = "Message must be between 50 and 1000 characters")
    String message
) {}

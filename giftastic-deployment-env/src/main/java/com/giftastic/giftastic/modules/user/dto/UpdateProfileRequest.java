package com.giftastic.giftastic.modules.user.dto;

import java.time.LocalDate;

public record UpdateProfileRequest(
    String fullName,
    String phoneNumber,
    LocalDate birthday
) {}

package com.giftastic.giftastic.modules.user.service;

import java.util.Optional;
import java.util.UUID;

import com.giftastic.giftastic.modules.user.domain.User;

public interface UserService {
    User registerUser(String email, String rawPassword);
    Optional<User> findByEmail(String email);
    void banUser(UUID userId);
    void unbanUser(UUID userId);
    void requestAdminRole(UUID userId);
    User updateProfile(UUID userId, String fullName, String phoneNumber, java.time.LocalDate birthday);
    User updateInstapayRefundDetails(UUID userId, String instapayRefundPhoneNumber, String instapayRefundName);
    User updateAddresses(UUID userId, java.util.List<com.giftastic.giftastic.modules.user.domain.Address> addresses);
    User getById(UUID userId);
    void deleteUser(UUID userId);
    com.giftastic.giftastic.modules.user.dto.PublicUserProfileResponse getPublicProfile(UUID userId);
}

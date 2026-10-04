package com.giftastic.giftastic.modules.user.repository;

import java.util.Optional;
import java.util.UUID;

import com.giftastic.giftastic.modules.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    java.util.List<User> findByRequestedAdmin(boolean requestedAdmin);
}
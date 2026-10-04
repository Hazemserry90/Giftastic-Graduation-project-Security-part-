package com.giftastic.giftastic.modules.admin.repository;

import com.giftastic.giftastic.modules.admin.domain.Admin;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Admin save(Admin admin);

    @Override
    @EntityGraph(attributePaths = "permissions")
    List<Admin> findAll();

    @EntityGraph(attributePaths = "permissions")
    Optional<Admin> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}

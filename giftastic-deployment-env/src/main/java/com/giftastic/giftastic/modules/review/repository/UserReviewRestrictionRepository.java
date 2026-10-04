package com.giftastic.giftastic.modules.review.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.giftastic.giftastic.modules.review.domain.UserReviewRestriction;

@Repository
public interface UserReviewRestrictionRepository extends JpaRepository<UserReviewRestriction, UUID> {
    Optional<UserReviewRestriction> findByUserId(UUID userId);
}

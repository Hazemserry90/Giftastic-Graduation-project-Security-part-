package com.giftastic.giftastic.modules.cart.repository;

import com.giftastic.giftastic.modules.cart.domain.Cart;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {
    Cart save(Cart cart);
    Optional<Cart> findByCustomerId(UUID customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cart c where c.customerId = :customerId")
    Optional<Cart> findByCustomerIdForUpdate(@Param("customerId") UUID customerId);

    void deleteByCustomerId(UUID customerId);
}

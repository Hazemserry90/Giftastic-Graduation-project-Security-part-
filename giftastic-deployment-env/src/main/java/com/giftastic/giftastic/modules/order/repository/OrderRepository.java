package com.giftastic.giftastic.modules.order.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giftastic.giftastic.modules.order.domain.Order;
import com.giftastic.giftastic.modules.order.domain.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    @EntityGraph(attributePaths = {"items"})
    Optional<Order> findById(UUID id);
    
    Order save(Order order);
    
    @EntityGraph(attributePaths = {"items"})
    List<Order> findByCustomerId(UUID customerId);
    
    @EntityGraph(attributePaths = {"items"})
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
    
    @EntityGraph(attributePaths = {"items"})
    List<Order> findByStatus(OrderStatus status);

    @EntityGraph(attributePaths = {"items"})
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    
    @EntityGraph(attributePaths = {"items"})
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i, Product p WHERE i.productId = p.id AND p.supplierId = :supplierId AND o.status IN ('IN_PROGRESS', 'OUT_FOR_DELIVERY', 'DONE')")
    @EntityGraph(attributePaths = {"items"})
    Page<Order> findBySupplierId(@Param("supplierId") UUID supplierId, Pageable pageable);
}

package com.giftastic.giftastic.modules.flow.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giftastic.giftastic.modules.flow.domain.GiftFlow;

public interface GiftFlowRepository extends JpaRepository<GiftFlow, UUID> {
    List<GiftFlow> findBySupplierId(UUID supplierId);
    long countBySupplierId(UUID supplierId);
    Optional<GiftFlow> findByIdAndSupplierId(UUID id, UUID supplierId);
    Page<GiftFlow> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("""
            select f from GiftFlow f
            where exists (
                select v from Vendor v
                where v.supplierId = f.supplierId
                  and v.isVerified = true
            )
            """)
    List<GiftFlow> findDiscoverable();

    @Query("""
            select f from GiftFlow f
            where f.supplierId = :supplierId
              and exists (
                select v from Vendor v
                where v.supplierId = f.supplierId
                  and v.isVerified = true
              )
            """)
    List<GiftFlow> findDiscoverableBySupplierId(@Param("supplierId") UUID supplierId);

    @Query("""
            select f from GiftFlow f
            where f.id = :id
              and exists (
                select v from Vendor v
                where v.supplierId = f.supplierId
                  and v.isVerified = true
              )
            """)
    Optional<GiftFlow> findDiscoverableById(@Param("id") UUID id);

    @Query("""
            select f from GiftFlow f
            where lower(f.name) like lower(concat('%', :name, '%'))
              and exists (
                select v from Vendor v
                where v.supplierId = f.supplierId
                  and v.isVerified = true
              )
            """)
    Page<GiftFlow> findDiscoverableByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);
}

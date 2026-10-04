package com.giftastic.giftastic.modules.product.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Product save(Product product);
    
    @EntityGraph(attributePaths = {"images"})
    Optional<Product> findById(UUID id);
    
    @EntityGraph(attributePaths = {"images"})
    List<Product> findBySupplierId(UUID supplierId);
    
    @EntityGraph(attributePaths = {"images"})
    List<Product> findByStatus(ProductStatus status);
    
    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    
    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatusAndNameContainingIgnoreCase(ProductStatus status, String name, Pageable pageable);

    @EntityGraph(attributePaths = {"images"})
    @Query("""
            select p from Product p
            where p.status = :status
              and exists (
                select v from Vendor v
                where v.supplierId = p.supplierId
                  and v.isVerified = true
              )
            """)
    List<Product> findDiscoverableByStatus(@Param("status") ProductStatus status);

    @EntityGraph(attributePaths = {"images"})
    @Query("""
            select p from Product p
            where p.status = :status
              and exists (
                select v from Vendor v
                where v.supplierId = p.supplierId
                  and v.isVerified = true
              )
            """)
    Page<Product> findDiscoverableByStatus(@Param("status") ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"images"})
    @Query("""
            select p from Product p
            where p.status = :status
              and lower(p.name) like lower(concat('%', :name, '%'))
              and exists (
                select v from Vendor v
                where v.supplierId = p.supplierId
                  and v.isVerified = true
              )
            """)
    Page<Product> findDiscoverableByStatusAndNameContainingIgnoreCase(
            @Param("status") ProductStatus status,
            @Param("name") String name,
            Pageable pageable);
    
    void deleteById(UUID id);
}

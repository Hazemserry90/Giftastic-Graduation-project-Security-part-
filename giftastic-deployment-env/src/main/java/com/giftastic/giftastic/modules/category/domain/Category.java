package com.giftastic.giftastic.modules.category.domain;

import java.util.UUID;

import io.micrometer.common.lang.NonNull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;

@Entity
@AllArgsConstructor
@Table(name="categories", indexes={
    @Index(name="idx_category_name", columnList="name")
})
public class Category {

    @NonNull
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @NonNull
    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @NonNull
    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @NonNull
    @Column(name = "name", nullable = false)
    private String name;

    public static Category create(String categoryName){
        String normalizedName = normalizeName(categoryName);
        UUID uuid = UUID.randomUUID();
        return new Category(uuid, uuid, normalizedName, normalizedName, new java.util.ArrayList<>());
    }

    public void rename(String categoryName) {
        String normalizedName = normalizeName(categoryName);
        this.categoryName = normalizedName;
        this.name = normalizedName;
    }

    private static String normalizeName(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("Category name can't be empty");
        }
        return categoryName.trim();
    }

    @ManyToMany(mappedBy="categories")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<com.giftastic.giftastic.modules.product.domain.Product> products = new java.util.ArrayList<>();

    protected Category() {}

    public UUID getId() {
        return id;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public java.util.List<com.giftastic.giftastic.modules.product.domain.Product> getProducts() {
        return products;
    }
}

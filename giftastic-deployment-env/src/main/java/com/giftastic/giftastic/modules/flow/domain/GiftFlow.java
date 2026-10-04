package com.giftastic.giftastic.modules.flow.domain;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "gift_flows")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GiftFlow {
    
    @Id
    @NonNull
    private UUID id;

    @NonNull
    @Column(nullable = false)
    private UUID supplierId;

    @NonNull
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NonNull
    @Column(columnDefinition = "TEXT", nullable = false)
    private String configuration;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String imageObjectKey;

    private String imageFilename;

    private String imageMimeType;

    private Long imageSizeBytes;

    private LocalDateTime imageUpdatedAt;

    @NonNull
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @NonNull
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public static GiftFlow create(@NonNull UUID supplierId, @NonNull String name, String description, String imageUrl, @NonNull String configuration) {
        return create(supplierId, name, description, imageUrl, configuration, 5);
    }

    public static GiftFlow create(@NonNull UUID supplierId, @NonNull String name, String description, String imageUrl, @NonNull String configuration, int maxSteps) {
        String sanitizedConfig = sanitizeAndValidateConfiguration(configuration, maxSteps);
        return new GiftFlow(
            UUID.randomUUID(),
            supplierId,
            name,
            description,
            imageUrl,
            sanitizedConfig,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    private GiftFlow(UUID id, UUID supplierId, String name, String description, String imageUrl, String configuration, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.configuration = configuration;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void update(String name, String description, String imageUrl, String configuration) {
        update(name, description, imageUrl, configuration, 5);
    }

    public void update(String name, String description, String imageUrl, String configuration, int maxSteps) {
        if (name != null && !name.isBlank()) this.name = name;
        if (description != null) this.description = description;
        if (imageUrl != null) this.imageUrl = imageUrl;
        
        if (configuration != null && !configuration.isBlank()) {
            this.configuration = sanitizeAndValidateConfiguration(configuration, maxSteps);
        }

        this.updatedAt = LocalDateTime.now();
    }

    public void updateImage(String imageUrl, String imageObjectKey, String imageFilename, String imageMimeType, long imageSizeBytes) {
        this.imageUrl = imageUrl;
        this.imageObjectKey = imageObjectKey;
        this.imageFilename = imageFilename;
        this.imageMimeType = imageMimeType;
        this.imageSizeBytes = imageSizeBytes;
        this.imageUpdatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void clearImage() {
        this.imageUrl = null;
        this.imageObjectKey = null;
        this.imageFilename = null;
        this.imageMimeType = null;
        this.imageSizeBytes = null;
        this.imageUpdatedAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    private static String sanitizeAndValidateConfiguration(String configurationJson, int maxSteps) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(configurationJson);
            com.fasterxml.jackson.databind.JsonNode steps = root.get("steps");
            
            if (steps != null && steps.isArray()) {
                if (steps.size() > maxSteps) {
                    throw new IllegalArgumentException("A gift flow can have at most " + maxSteps + " steps.");
                }
                if (steps.isEmpty()) {
                    throw new IllegalArgumentException("A gift flow must have at least one step.");
                }

                boolean hasRequiredStep = false;
                for (com.fasterxml.jackson.databind.JsonNode stepNode : steps) {
                    if (stepNode instanceof com.fasterxml.jackson.databind.node.ObjectNode) {
                        com.fasterxml.jackson.databind.node.ObjectNode step = (com.fasterxml.jackson.databind.node.ObjectNode) stepNode;
                        
                        com.fasterxml.jackson.databind.JsonNode products = step.get("products");
                        int productCount = 0;
                        if (products != null && products.isArray()) {
                            productCount = products.size();
                        }
                        
                        // Automatically set type based on product count
                        if (productCount > 1) {
                            step.put("type", "multiple");
                        } else {
                            step.put("type", "single");
                        }
                        
                        boolean stepRequired = !step.has("required") || step.get("required").asBoolean(true);
                        if (stepRequired) {
                            hasRequiredStep = true;
                        }
                        boolean hasRequiredProduct = false;
                        if (products != null && products.isArray()) {
                            for (com.fasterxml.jackson.databind.JsonNode productNode : products) {
                                if (productNode instanceof com.fasterxml.jackson.databind.node.ObjectNode) {
                                    com.fasterxml.jackson.databind.node.ObjectNode product = (com.fasterxml.jackson.databind.node.ObjectNode) productNode;
                                    
                                    int pMin = product.has("min") ? product.get("min").asInt() : 0;
                                    int pMax = product.has("max") ? product.get("max").asInt() : 1;
                                    boolean required = product.has("required") && product.get("required").asBoolean(false);
                                    if (required && pMin < 1) {
                                        pMin = 1;
                                        product.put("min", pMin);
                                    }
                                    if (required) {
                                        hasRequiredProduct = true;
                                    }
                                    
                                    if (pMin > pMax) {
                                        throw new IllegalArgumentException("Product min selection cannot exceed max selection.");
                                    }
                                }
                            }
                        }
                        if (stepRequired && !hasRequiredProduct) {
                            throw new IllegalArgumentException("Required gift flow steps must include at least one required product.");
                        }
                    }
                }
                if (!hasRequiredStep) {
                    throw new IllegalArgumentException("A gift flow must have at least one required step.");
                }
            } else {
                throw new IllegalArgumentException("A gift flow must have at least one step.");
            }
            return mapper.writeValueAsString(root);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid configuration JSON: " + e.getMessage());
        }
    }
}

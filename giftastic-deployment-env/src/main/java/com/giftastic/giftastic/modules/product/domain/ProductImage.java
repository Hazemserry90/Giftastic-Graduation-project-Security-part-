package com.giftastic.giftastic.modules.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class ProductImage {

    @Column(nullable = false)
    private UUID id;

    // Use @Transient so JPA doesn't try to save this field.
    // The link is already handled by the 'product_id' JoinColumn in the Product class.
    @Transient
    private UUID productId;

    @Column(nullable = false)
    private String url;

    private UUID vendorId;

    @Column(columnDefinition = "TEXT")
    private String objectKey;

    private String filename;

    private String mimeType;

    private Long sizeBytes;

    @Column(name = "is_primary")
    private boolean primary;

    private int displayOrder;

    private LocalDateTime createdAt;

    public ProductImage(UUID id, UUID productId, String url, boolean primary, int displayOrder) {
        this(id, productId, url, null, null, null, null, null, primary, displayOrder, LocalDateTime.now());
    }

    public void markAsPrimary() {
        this.primary = true;
    }

    public void unmarkPrimary() {
        this.primary = false;
    }

    public void updateDisplayOrder(int order) {
        if (order < 0) throw new IllegalArgumentException();
        this.displayOrder = order;
    }
}

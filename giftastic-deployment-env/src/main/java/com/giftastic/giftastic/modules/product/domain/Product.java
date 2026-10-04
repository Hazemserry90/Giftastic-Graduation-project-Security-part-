package com.giftastic.giftastic.modules.product.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import com.giftastic.giftastic.common.pricing.CommissionPriceQuote;
import com.giftastic.giftastic.common.pricing.CommissionRates;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "products", indexes = {
    @jakarta.persistence.Index(name = "idx_product_status", columnList = "status"),
    @jakarta.persistence.Index(name = "idx_product_supplier", columnList = "supplierId")
})
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Product {

    @NonNull
    @Column(nullable = false)
    private UUID supplierId;

    @Id
    @NonNull
    @lombok.Setter
    private UUID id;

    @NonNull
    @Column(nullable = false)
    private String name;

    @NonNull
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @NonNull
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_mode")
    private VendorPricingMode pricingMode = VendorPricingMode.CUSTOMER_PRICE;

    @Transient
    private BigDecimal currentCommissionRate;

    @Embedded
    private ProductDetails details = ProductDetails.createDefault();

    @NonNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;

    @NonNull
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @NonNull
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = true)
    private LocalDateTime publishedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_request_status")
    private ProductReviewRequestStatus reviewRequestStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_requested_from_status")
    private ProductStatus reviewRequestedFromStatus;

    @Column(name = "review_requested_at")
    private LocalDateTime reviewRequestedAt;

    @Column(name = "review_reviewed_at")
    private LocalDateTime reviewReviewedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "review_request_message", columnDefinition = "TEXT")
    private String reviewRequestMessage;

    @Column(name = "review_rejection_reason", columnDefinition = "TEXT")
    private String reviewRejectionReason;

    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.valueOf(0.0);

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;
    
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;
    
    @Column(name = "discount_start_date")
    private LocalDateTime discountStartDate;
    
    @Column(name = "discount_end_date")
    private LocalDateTime discountEndDate;

    @ManyToMany
    @JoinTable(
        name = "product_categories",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<com.giftastic.giftastic.modules.category.domain.Category> categories = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @NonNull
    private List<ProductImage> images = new ArrayList<>();

    public static Product create(
            @NonNull UUID supplierId,
            @NonNull String name,
            @NonNull BigDecimal price,
            @NonNull String description
    ) {
        return create(supplierId, name, price, description, VendorPricingMode.CUSTOMER_PRICE);
    }

    public static Product create(
            @NonNull UUID supplierId,
            @NonNull String name,
            @NonNull BigDecimal price,
            @NonNull String description,
            VendorPricingMode pricingMode
    ) {
        validateName(name);
        validatePrice(price);

        Product product = new Product(
                UUID.randomUUID(),
                supplierId,
                name,
                description,
                price,
                ProductStatus.DRAFT,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        product.pricingMode = pricingMode == null ? VendorPricingMode.CUSTOMER_PRICE : pricingMode;
        return product;
    }

    private Product(UUID id,
                    UUID supplierId,
                    String name,
                    String description,
                    BigDecimal price,
                    ProductStatus status,
                    LocalDateTime createdAt,
                    LocalDateTime updatedAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void addImage(ProductImage image) {
        Objects.requireNonNull(image, "Image cannot be null");
        if (!image.getProductId().equals(this.id))
            throw new IllegalArgumentException("Image does not belong to this product");

        if (image.isPrimary()) {
            images.forEach(ProductImage::unmarkPrimary);
        }

        if (images.stream().anyMatch(img -> img.getId().equals(image.getId())))
            throw new IllegalArgumentException("Duplicate image ID");

        images.add(image);
        touch();
    }

    public void removeImage(UUID imageId) {
        boolean removed = images.removeIf(img -> img.getId().equals(imageId));
        if (!removed) throw new IllegalArgumentException("Image not found");
        touch();
    }

    public void setPrimaryImage(UUID imageId) {
        boolean found = false;
        for (ProductImage img : images) {
            if (img.getId().equals(imageId)) {
                img.markAsPrimary();
                found = true;
            } else {
                img.unmarkPrimary();
            }
        }
        if (!found) throw new IllegalArgumentException("Image not found");
        touch();
    }

    public void addCategory(com.giftastic.giftastic.modules.category.domain.Category category) {
        Objects.requireNonNull(category, "Category cannot be null");
        if (!categories.contains(category)) {
            categories.add(category);
            touch();
        }
    }

    public void removeCategory(com.giftastic.giftastic.modules.category.domain.Category category) {
        Objects.requireNonNull(category, "Category cannot be null");
        if (categories.remove(category)) {
            touch();
        }
    }

    public void setCategories(List<com.giftastic.giftastic.modules.category.domain.Category> newCategories) {
        Objects.requireNonNull(newCategories, "Categories list cannot be null");
        this.categories = new ArrayList<>(newCategories);
        touch();
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name cannot be blank");
    }

    private static void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Price must be positive");
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateName(String name) {
        validateName(name);
        this.name = name;
        touch();
    }

    public void updateDescription(String description) {
        this.description = description;
        touch();
    }

    public void updatePrice(BigDecimal price) {
        validatePrice(price);
        this.price = price;
        touch();
    }

    public void updatePricingMode(VendorPricingMode pricingMode) {
        this.pricingMode = pricingMode == null ? VendorPricingMode.CUSTOMER_PRICE : pricingMode;
        touch();
    }

    public VendorPricingMode getEffectivePricingMode() {
        return pricingMode == null ? VendorPricingMode.CUSTOMER_PRICE : pricingMode;
    }

    public void applyCommissionRate(BigDecimal rate) {
        this.currentCommissionRate = CommissionRates.normalizeToFraction(rate);
    }

    public BigDecimal getCustomerPrice() {
        if (currentCommissionRate == null) return getDiscountedPrice();
        return CommissionPriceQuote.calculate(getDiscountedPrice(), currentCommissionRate, getEffectivePricingMode())
                .customerPrice();
    }

    public BigDecimal getCustomerOriginalPrice() {
        if (currentCommissionRate == null) return price;
        return CommissionPriceQuote.calculate(price, currentCommissionRate, getEffectivePricingMode()).customerPrice();
    }

    public BigDecimal getEstimatedVendorPayout() {
        if (currentCommissionRate == null) return null;
        return CommissionPriceQuote.calculate(getDiscountedPrice(), currentCommissionRate, getEffectivePricingMode())
                .vendorPayout();
    }

    public void setDetails(ProductDetails details) {
        this.details = details != null ? details : ProductDetails.createDefault();
        touch();
    }

    public void update(String name, String description, BigDecimal price, ProductDetails details) {
        updateName(name);
        updateDescription(description);
        updatePrice(price);
        setDetails(details);
    }

    public void submitForApproval() {
        submitForApproval(null);
    }

    public void submitForApproval(String message) {
        if (status == ProductStatus.PENDING_APPROVAL && reviewRequestStatus == ProductReviewRequestStatus.PENDING) {
            throw new IllegalStateException("A review request is already pending for this product.");
        }
        if (status != ProductStatus.DRAFT && status != ProductStatus.DISABLED) {
            throw new IllegalStateException("Can only submit draft or disabled products for approval");
        }
        reviewRequestedFromStatus = status;
        reviewRequestStatus = ProductReviewRequestStatus.PENDING;
        reviewRequestedAt = LocalDateTime.now();
        reviewReviewedAt = null;
        reviewedBy = null;
        reviewRequestMessage = normalizeOptionalText(message);
        reviewRejectionReason = null;
        status = ProductStatus.PENDING_APPROVAL;
        touch();
    }

    public void approve() {
        approve(null);
    }

    public void approve(UUID reviewerId) {
        ensureStatus(ProductStatus.PENDING_APPROVAL);
        reviewRequestStatus = ProductReviewRequestStatus.APPROVED;
        reviewReviewedAt = LocalDateTime.now();
        reviewedBy = reviewerId;
        reviewRejectionReason = null;
        status = ProductStatus.APPROVED;
        if (publishedAt == null) {
            publishedAt = LocalDateTime.now();
        }
        touch();
    }

    public void approveDirectly() {
        approveDirectly(null);
    }

    public void approveDirectly(UUID reviewerId) {
        if (status != ProductStatus.DRAFT && status != ProductStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Can only approve products in DRAFT or PENDING_APPROVAL status");
        }
        if (status == ProductStatus.PENDING_APPROVAL) {
            reviewRequestStatus = ProductReviewRequestStatus.APPROVED;
            reviewReviewedAt = LocalDateTime.now();
            reviewedBy = reviewerId;
            reviewRejectionReason = null;
        }
        status = ProductStatus.APPROVED;
        if (publishedAt == null) {
            publishedAt = LocalDateTime.now();
        }
        touch();
    }

    public void reject() {
        reject(null);
    }

    public void reject(String reason) {
        reject(reason, null);
    }

    public void reject(String reason, UUID reviewerId) {
        ensureStatus(ProductStatus.PENDING_APPROVAL);
        reviewRequestStatus = ProductReviewRequestStatus.REJECTED;
        reviewReviewedAt = LocalDateTime.now();
        reviewedBy = reviewerId;
        reviewRejectionReason = normalizeOptionalText(reason);
        status = reviewRequestedFromStatus == ProductStatus.DISABLED
                ? ProductStatus.DISABLED
                : ProductStatus.REJECTED;
        touch();
    }

    public void disable() {
        ensureStatus(ProductStatus.APPROVED);
        status = ProductStatus.DISABLED;
        touch();
    }

    public void enable() {
        ensureStatus(ProductStatus.DISABLED);
        status = ProductStatus.APPROVED;
        touch();
    }

    private void ensureStatus(ProductStatus expected) {
        if (status != expected)
            throw new IllegalStateException(
                    "Invalid status transition: current=" + status + ", expected=" + expected
            );
    }

    public void updateRating(BigDecimal averageRating, Integer reviewCount) {
        this.averageRating = averageRating != null ? averageRating : BigDecimal.ZERO;
        this.reviewCount = reviewCount != null ? reviewCount : 0;
        touch();
    }

    public void updateStock(Integer stockQuantity) {
        if (stockQuantity == null || stockQuantity < 0) {
            throw new IllegalArgumentException("Stock quantity must be >= 0");
        }
        this.stockQuantity = stockQuantity;
        touch();
    }

    public void decreaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (this.stockQuantity < quantity) {
            throw new IllegalStateException("Insufficient stock");
        }
        this.stockQuantity -= quantity;
        touch();
    }

    public void increaseStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.stockQuantity += quantity;
        touch();
    }

    private static String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public boolean hasStock(int quantity) {
        return this.stockQuantity >= quantity;
    }

    public boolean isInStock() {
        return this.stockQuantity > 0;
    }
    
    public void setDiscount(BigDecimal percentage, LocalDateTime startDate, LocalDateTime endDate) {
        if (percentage != null && (percentage.compareTo(BigDecimal.ZERO) < 0 || percentage.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }
        this.discountPercentage = percentage != null ? percentage : BigDecimal.ZERO;
        this.discountStartDate = startDate;
        this.discountEndDate = endDate;
        touch();
    }
    
    public void removeDiscount() {
        this.discountPercentage = BigDecimal.ZERO;
        this.discountStartDate = null;
        this.discountEndDate = null;
        touch();
    }
    
    public boolean hasActiveDiscount() {
        if (discountPercentage == null || discountPercentage.compareTo(BigDecimal.ZERO) == 0) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        boolean afterStart = discountStartDate == null || now.isAfter(discountStartDate) || now.isEqual(discountStartDate);
        boolean beforeEnd = discountEndDate == null || now.isBefore(discountEndDate);
        return afterStart && beforeEnd;
    }
    
    public BigDecimal getDiscountedPrice() {
        if (!hasActiveDiscount()) {
            return price;
        }
        BigDecimal discount = price.multiply(discountPercentage).divide(BigDecimal.valueOf(100));
        return price.subtract(discount);
    }
}

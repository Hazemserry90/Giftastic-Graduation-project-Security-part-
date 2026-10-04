package com.giftastic.giftastic.modules.product.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.product.domain.TargetGender;
import com.giftastic.giftastic.common.pricing.VendorPricingMode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProductCreateRequest(
    @NotNull(message = "Supplier ID is required") UUID supplierId,
    @NotBlank(message = "Name is required") String name,
    @NotNull(message = "Price is required") @Positive(message = "Price must be positive") BigDecimal price,
    VendorPricingMode pricingMode,
    Integer stockQuantity,
    @NotEmpty(message = "At least one category is required") List<UUID> categoryIds,
    @NotBlank(message = "Description is required") String description,
    @Valid ProductDetailsRequest details,
    @Valid List<ProductImageRequest> images
) {
    public record ProductDetailsRequest(
        BigDecimal giftWrapPrice,
        BigDecimal engravingPrice,
        BigDecimal customMessagePrice,
        String videoUrl,
        Boolean allowsEngraving,
        Integer engravingMaxLength,
        Boolean allowsCustomMessage,
        Integer maxMessageLength,
        Boolean allowsColorChoice,
        String availableColors,
        Boolean allowsSizeChoice,
        String availableSizes,
        Boolean allowsGiftWrap,
        Boolean isGiftWrapped,
        Boolean includesGiftBox,
        Boolean includesRibbon,
        Boolean allowsGiftReceipt,
        Boolean requiresDeliveryDate,
        Boolean allowsScheduledDelivery,
        Integer minDeliveryDays,
        Integer maxDeliveryDays,
        Boolean isPerishable,
        Integer shelfLifeDays,
        Boolean requiresRecipientInfo,
        Boolean requiresRecipientName,
        Boolean requiresRecipientEmail,
        Boolean requiresRecipientPhone,
        Boolean requiresRecipientAddress,
        Boolean allowsAnonymousGift,
        Boolean isContainer,
        Boolean containsLetter,
        Boolean containsCard,
        Boolean containsFlowers,
        Boolean containsChocolates,
        Boolean containsFood,
        Integer itemCount,
        String tags,
        Boolean isFeatured,
        Boolean isBestseller,
        Boolean isNewArrival,
        TargetGender gender,
        String seasonalAvailability,
        String occasion,
        String recipientType,
        String ageGroup,
        String slug,
        String metaTitle,
        String metaDescription,
        String vendorSku,
        String vendorNotes,
        Integer fulfillmentTime,
        Boolean handmade,
        Boolean madeToOrder,
        Boolean customizable
    ) {}

    public record ProductImageRequest(
        @NotBlank(message = "Image URL is required") String url,
        Boolean primary,
        Integer displayOrder
    ) {}
}

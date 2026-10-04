package com.giftastic.giftastic.modules.product.domain;

import java.math.BigDecimal;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductDetails {

    // --- PRICING ADD-ONS ---
    private BigDecimal giftWrapPrice;
    private BigDecimal engravingPrice;
    private BigDecimal customMessagePrice;

    // --- MEDIA ---
    private String videoUrl;

    // --- PERSONALIZATION ---
    public static final int SYSTEM_MAX_ENGRAVING_LENGTH = 100;
    public static final int SYSTEM_MAX_MESSAGE_LENGTH = 1000;

    private boolean allowsEngraving;
    private int engravingMaxLength;
    
    private boolean allowsEmbroidery;
    
    private boolean allowsCustomMessage;
    private int maxMessageLength;
    
    private boolean allowsPhotoUpload;
    
    private boolean allowsColorChoice;
    private String availableColors;
    
    private boolean allowsSizeChoice;
    private String availableSizes;

    // --- PRESENTATION ---
    private boolean allowsGiftWrap;
    private boolean isGiftWrapped;
    private boolean includesGiftBox;
    private boolean includesRibbon;
    private boolean allowsGiftReceipt = true;

    // --- DELIVERY ---
    private boolean requiresDeliveryDate;
    private boolean allowsScheduledDelivery;
    private int minDeliveryDays;
    private int maxDeliveryDays;
    
    private boolean isPerishable;
    private int shelfLifeDays;

    // --- RECIPIENT ---
    private boolean requiresRecipientInfo;
    private boolean requiresRecipientName;
    private boolean requiresRecipientEmail;
    private boolean requiresRecipientPhone;
    private boolean requiresRecipientAddress;
    private boolean allowsAnonymousGift = true;

    // --- COMPOSITION ---
    private boolean isContainer;
    private boolean containsLetter;
    private boolean containsCard;
    private boolean containsFlowers;
    private boolean containsChocolates;
    private boolean containsFood;
    private int itemCount;

    // --- MARKETING & SEO ---
    private String tags;
    private boolean isFeatured;
    private boolean isBestseller;
    private boolean isNewArrival;
    
    @Enumerated(EnumType.STRING)
    private TargetGender gender = TargetGender.UNISEX;
    
    private String seasonalAvailability;
    private String occasion;
    private String recipientType;
    private String ageGroup;
    
    private String slug;
    private String metaTitle;
    private String metaDescription;

    // --- VENDOR INFO ---
    private String vendorSku;
    private String vendorNotes;
    private int fulfillmentTime;
    private boolean handmade;
    private boolean madeToOrder;
    private boolean customizable;

    public static ProductDetails createDefault() {
        return new ProductDetails();
    }

    public void configurePersonalization(boolean allowsEngraving, int engravingMaxLength, 
                                         boolean allowsCustomMessage, int maxMessageLength) {
        this.allowsEngraving = allowsEngraving;
        if (allowsEngraving) {
            if (engravingMaxLength > SYSTEM_MAX_ENGRAVING_LENGTH) {
                throw new IllegalArgumentException("Engraving limit cannot exceed system maximum of " + SYSTEM_MAX_ENGRAVING_LENGTH);
            }
            this.engravingMaxLength = engravingMaxLength;
        }

        this.allowsCustomMessage = allowsCustomMessage;
        if (allowsCustomMessage) {
            if (maxMessageLength > SYSTEM_MAX_MESSAGE_LENGTH) {
                throw new IllegalArgumentException("Message limit cannot exceed system maximum of " + SYSTEM_MAX_MESSAGE_LENGTH);
            }
            this.maxMessageLength = maxMessageLength;
        }
    }

    public void configurePricing(BigDecimal giftWrapPrice, BigDecimal engravingPrice, BigDecimal customMessagePrice) {
        if (giftWrapPrice != null && giftWrapPrice.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Gift wrap price must be >= 0");
        if (engravingPrice != null && engravingPrice.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Engraving price must be >= 0");
        if (customMessagePrice != null && customMessagePrice.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("Message price must be >= 0");
        
        this.giftWrapPrice = giftWrapPrice;
        this.engravingPrice = engravingPrice;
        this.customMessagePrice = customMessagePrice;
    }

    public void configureColors(boolean allowsColorChoice, String availableColors) {
        this.allowsColorChoice = allowsColorChoice;
        this.availableColors = availableColors;
    }

    public void configureSizes(boolean allowsSizeChoice, String availableSizes) {
        this.allowsSizeChoice = allowsSizeChoice;
        this.availableSizes = availableSizes;
    }

    public void configureDelivery(boolean isPerishable, int shelfLifeDays, int minDeliveryDays, int maxDeliveryDays) {
        this.isPerishable = isPerishable;
        this.shelfLifeDays = shelfLifeDays;
        this.minDeliveryDays = minDeliveryDays;
        this.maxDeliveryDays = maxDeliveryDays;
    }

    public void configureMedia(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public void configurePresentation(boolean allowsGiftWrap, boolean isGiftWrapped, boolean includesGiftBox, boolean includesRibbon, boolean allowsGiftReceipt) {
        this.allowsGiftWrap = allowsGiftWrap;
        this.isGiftWrapped = isGiftWrapped;
        this.includesGiftBox = includesGiftBox;
        this.includesRibbon = includesRibbon;
        this.allowsGiftReceipt = allowsGiftReceipt;
    }

    public void configureRecipient(boolean requiresRecipientInfo, boolean requiresRecipientName,
                                   boolean requiresRecipientEmail, boolean requiresRecipientPhone,
                                   boolean requiresRecipientAddress, boolean allowsAnonymousGift) {
        this.requiresRecipientInfo = requiresRecipientInfo;
        this.requiresRecipientName = requiresRecipientName;
        this.requiresRecipientEmail = requiresRecipientEmail;
        this.requiresRecipientPhone = requiresRecipientPhone;
        this.requiresRecipientAddress = requiresRecipientAddress;
        this.allowsAnonymousGift = allowsAnonymousGift;
    }

    public void configureComposition(boolean isContainer, boolean containsLetter, boolean containsCard,
                                     boolean containsFlowers, boolean containsChocolates, boolean containsFood,
                                     int itemCount) {
        this.isContainer = isContainer;
        this.containsLetter = containsLetter;
        this.containsCard = containsCard;
        this.containsFlowers = containsFlowers;
        this.containsChocolates = containsChocolates;
        this.containsFood = containsFood;
        this.itemCount = itemCount;
    }

    public void configureMarketing(String tags, boolean featured, boolean bestseller, boolean newArrival,
                                   TargetGender gender, String seasonalAvailability, String occasion,
                                   String recipientType, String ageGroup) {
        this.tags = tags;
        this.isFeatured = featured;
        this.isBestseller = bestseller;
        this.isNewArrival = newArrival;
        this.gender = gender != null ? gender : TargetGender.UNISEX;
        this.seasonalAvailability = seasonalAvailability;
        this.occasion = occasion;
        this.recipientType = recipientType;
        this.ageGroup = ageGroup;
    }

    public void configureSeoAndMarketing(String tags, String slug, String metaTitle, String metaDescription) {
        this.tags = tags;
        this.slug = slug;
        this.metaTitle = metaTitle;
        this.metaDescription = metaDescription;
    }

    public void configureVendorInfo(String vendorSku, String vendorNotes, int fulfillmentTime, boolean handmade,
                                    boolean madeToOrder, boolean customizable) {
        this.vendorSku = vendorSku;
        this.vendorNotes = vendorNotes;
        this.fulfillmentTime = fulfillmentTime;
        this.handmade = handmade;
        this.madeToOrder = madeToOrder;
        this.customizable = customizable;
    }
}

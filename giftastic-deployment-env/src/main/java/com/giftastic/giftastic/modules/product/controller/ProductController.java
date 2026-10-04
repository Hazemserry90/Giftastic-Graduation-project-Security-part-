package com.giftastic.giftastic.modules.product.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.modules.category.domain.Category;
import com.giftastic.giftastic.modules.category.repository.CategoryRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.dto.ProductImageResponse;
import com.giftastic.giftastic.modules.product.dto.ReorderProductImagesRequest;
import com.giftastic.giftastic.modules.product.service.ProductService;
import com.giftastic.giftastic.modules.product.service.ProductImageService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management endpoints")
@SecurityRequirement(name = "bearer-jwt")
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;
    private final CategoryRepository categoryRepository;
    private final com.giftastic.giftastic.modules.product.service.ProductSearchService productSearchService;
    public record SubmitProductReviewRequest(String message) {}
    public record RejectProductRequest(String reason) {}

    @PostMapping
    @PreAuthorize("hasPermission(#request.supplierId(), 'VENDOR_OWNER')")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody com.giftastic.giftastic.modules.product.dto.ProductCreateRequest request) {
        log.info("Creating product: name={}, supplierId={}, stockQuantity={}", 
            request.name(), request.supplierId(), request.stockQuantity());
        
        try {
            Product product = Product.create(
                request.supplierId(),
                request.name(),
                request.price(),
                request.description(),
                request.pricingMode()
            );

            // Set stock quantity
            if (request.stockQuantity() != null) {
                log.debug("Setting stock quantity: {}", request.stockQuantity());
                product.updateStock(request.stockQuantity());
            } else {
                log.warn("Stock quantity not provided, using default: 0");
            }

            applyDetails(product, request.details());
        
        // Fetch and add categories
        Iterable<UUID> categoryIds = java.util.Objects.requireNonNull(request.categoryIds());
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.isEmpty()) {
            throw new IllegalArgumentException("No valid categories found");
        }
        product.setCategories(categories);

        Product savedProduct = productService.createProduct(product);
        log.info("Product created successfully: id={}, stockQuantity={}", 
            savedProduct.getId(), savedProduct.getStockQuantity());
        return ResponseEntity.ok(savedProduct);
    } catch (Exception e) {
        log.error("Failed to create product: {}", e.getMessage(), e);
        throw e;
    }
}

    @PatchMapping("/{productId}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable UUID productId,
            @Valid @RequestBody com.giftastic.giftastic.modules.product.dto.ProductCreateRequest request) {
        Product existing = productService.getOrThrow(productId);
        
        // Security check
        UUID currentSupplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (!existing.getSupplierId().equals(currentSupplierId) && !com.giftastic.giftastic.common.security.SecurityUtils.hasAuthority("SUPER_ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        Product updateData = Product.create(
            request.supplierId(),
            request.name(),
            request.price(),
            request.description(),
            request.pricingMode()
        );
        updateData.setId(productId);
        
        // Set stock quantity
        if (request.stockQuantity() != null) {
            updateData.updateStock(request.stockQuantity());
        }
        
        applyDetails(updateData, request.details());
        
        // Categories
        Iterable<UUID> categoryIds = java.util.Objects.requireNonNull(request.categoryIds());
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        updateData.setCategories(categories);

        return ResponseEntity.ok(productService.updateProduct(productId, updateData));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID productId) {
        Product existing = productService.getOrThrow(productId);
        
        // Security check
        UUID currentSupplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (!existing.getSupplierId().equals(currentSupplierId) && 
            !com.giftastic.giftastic.common.security.SecurityUtils.hasAuthority("SUPER_ADMIN") &&
            !com.giftastic.giftastic.common.security.SecurityUtils.hasAuthority("DELETE_PRODUCTS")) {
            return ResponseEntity.status(403).build();
        }

        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vendor")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<Product>> getCurrentVendorProducts() {
        UUID supplierId = SecurityUtils.getCurrentSupplierId();
        log.info("Fetching products for vendor: supplierId={}", supplierId);
        
        if (supplierId == null) {
            log.warn("No supplierId found for current vendor");
            return ResponseEntity.ok(List.of());
        }

        List<Product> products = productService.getProductsForSupplier(supplierId);
        log.info("Found {} products for vendor {}", products.size(), supplierId);
        
        if (!products.isEmpty()) {
            log.debug("Sample product stockQuantity: {}", products.get(0).getStockQuantity());
        }
        
        return ResponseEntity.ok(products);
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<Product>> getProductsBySupplier(@PathVariable UUID supplierId) {
        return ResponseEntity.ok(productService.getDiscoverableProductsForSupplier(supplierId));
    }

    /**
     * Public Action: List or search approved products.
     */
    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String query,
            Pageable pageable) {
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(productService.searchProducts(query, pageable));
        }
        return ResponseEntity.ok(productService.getDiscoverableProducts(pageable));
    }

    /**
     * Public Action: Get product details.
     */
    @GetMapping("/{productId}")
    public ResponseEntity<Product> getProduct(@PathVariable UUID productId) {
        Product product = productService.getOrThrow(productId);
        
        boolean isAdmin = com.giftastic.giftastic.common.security.SecurityUtils.hasAuthority("SUPER_ADMIN");
        boolean isOwner = false;
        
        UUID currentSupplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        if (currentSupplierId != null && currentSupplierId.equals(product.getSupplierId())) {
            isOwner = true;
        }

        if (!productService.isProductDiscoverable(product) && !isAdmin && !isOwner) {
            throw new com.giftastic.giftastic.common.exception.ResourceNotFoundException("Product not found");
        }
        
        return ResponseEntity.ok(product);
    }

    @GetMapping("/{productId}/images")
    public ResponseEntity<List<ProductImageResponse>> getProductImages(@PathVariable UUID productId) {
        Product product = productService.getOrThrow(productId);
        boolean isAdmin = com.giftastic.giftastic.common.security.SecurityUtils.hasAuthority("SUPER_ADMIN");
        UUID currentSupplierId = com.giftastic.giftastic.common.security.SecurityUtils.getCurrentSupplierId();
        boolean isOwner = currentSupplierId != null && currentSupplierId.equals(product.getSupplierId());
        if (!productService.isProductDiscoverable(product) && !isAdmin && !isOwner) {
            throw new com.giftastic.giftastic.common.exception.ResourceNotFoundException("Product not found");
        }
        return ResponseEntity.ok(productImageService.listProductImages(productId));
    }

    @PostMapping(value = "/{productId}/images", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductImageResponse> uploadProductImage(
            @PathVariable UUID productId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productImageService.uploadProductImage(productId, file));
    }

    @PatchMapping("/{productId}/images/{imageId}/primary")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductImageResponse> setPrimaryProductImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        return ResponseEntity.ok(productImageService.setPrimaryImage(productId, imageId));
    }

    @PatchMapping("/{productId}/images/reorder")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<ProductImageResponse>> reorderProductImages(
            @PathVariable UUID productId,
            @Valid @RequestBody ReorderProductImagesRequest request) {
        return ResponseEntity.ok(productImageService.reorderProductImages(productId, request.imageIds()));
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteProductImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        productImageService.deleteProductImage(productId, imageId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Vendor Action: Submit a product for review.
     */
    @PostMapping("/{productId}/submit")
    @PreAuthorize("hasPermission(#productId, 'PRODUCT_OWNER')")
    public ResponseEntity<Void> submit(
            @PathVariable UUID productId,
            @RequestBody(required = false) SubmitProductReviewRequest request) {
        productService.submitForApproval(productId, request == null ? null : request.message());
        return ResponseEntity.noContent().build();
    }

    /**
     * Admin Action: Approve a product.
     * Uses your specific 'ACTIVATE_PRODUCTS' permission.
     */
    @PatchMapping("/{productId}/approve")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PRODUCTS')")
    public ResponseEntity<Void> approve(@PathVariable UUID productId) {
        productService.approveProduct(productId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Admin Action: Reject a product.
     */
    @PatchMapping("/{productId}/reject")
    @PreAuthorize("hasPermission(null, 'REJECT_PRODUCTS')")
    public ResponseEntity<Void> reject(
            @PathVariable UUID productId,
            @RequestBody(required = false) RejectProductRequest request) {
        productService.rejectProduct(productId, request == null ? null : request.reason());
        return ResponseEntity.noContent().build();
    }

    private void applyDetails(Product product, com.giftastic.giftastic.modules.product.dto.ProductCreateRequest.ProductDetailsRequest detailsRequest) {
        if (detailsRequest == null) {
            return;
        }

        product.getDetails().configurePricing(
            detailsRequest.giftWrapPrice(),
            detailsRequest.engravingPrice(),
            detailsRequest.customMessagePrice()
        );
        product.getDetails().configureMedia(detailsRequest.videoUrl());

        if (detailsRequest.allowsEngraving() != null || detailsRequest.allowsCustomMessage() != null) {
            product.getDetails().configurePersonalization(
                Boolean.TRUE.equals(detailsRequest.allowsEngraving()),
                defaultInt(detailsRequest.engravingMaxLength()),
                Boolean.TRUE.equals(detailsRequest.allowsCustomMessage()),
                defaultInt(detailsRequest.maxMessageLength())
            );
        }

        product.getDetails().configureColors(
            Boolean.TRUE.equals(detailsRequest.allowsColorChoice()),
            detailsRequest.availableColors()
        );
        product.getDetails().configureSizes(
            Boolean.TRUE.equals(detailsRequest.allowsSizeChoice()),
            detailsRequest.availableSizes()
        );
        product.getDetails().configurePresentation(
            Boolean.TRUE.equals(detailsRequest.allowsGiftWrap()),
            Boolean.TRUE.equals(detailsRequest.isGiftWrapped()),
            Boolean.TRUE.equals(detailsRequest.includesGiftBox()),
            Boolean.TRUE.equals(detailsRequest.includesRibbon()),
            detailsRequest.allowsGiftReceipt() == null || detailsRequest.allowsGiftReceipt()
        );
        product.getDetails().configureDelivery(
            Boolean.TRUE.equals(detailsRequest.isPerishable()),
            defaultInt(detailsRequest.shelfLifeDays()),
            defaultInt(detailsRequest.minDeliveryDays()),
            defaultInt(detailsRequest.maxDeliveryDays())
        );
        product.getDetails().configureRecipient(
            Boolean.TRUE.equals(detailsRequest.requiresRecipientInfo()),
            Boolean.TRUE.equals(detailsRequest.requiresRecipientName()),
            Boolean.TRUE.equals(detailsRequest.requiresRecipientEmail()),
            Boolean.TRUE.equals(detailsRequest.requiresRecipientPhone()),
            Boolean.TRUE.equals(detailsRequest.requiresRecipientAddress()),
            detailsRequest.allowsAnonymousGift() == null || detailsRequest.allowsAnonymousGift()
        );
        product.getDetails().configureComposition(
            Boolean.TRUE.equals(detailsRequest.isContainer()),
            Boolean.TRUE.equals(detailsRequest.containsLetter()),
            Boolean.TRUE.equals(detailsRequest.containsCard()),
            Boolean.TRUE.equals(detailsRequest.containsFlowers()),
            Boolean.TRUE.equals(detailsRequest.containsChocolates()),
            Boolean.TRUE.equals(detailsRequest.containsFood()),
            defaultInt(detailsRequest.itemCount())
        );
        product.getDetails().configureMarketing(
            detailsRequest.tags(),
            Boolean.TRUE.equals(detailsRequest.isFeatured()),
            Boolean.TRUE.equals(detailsRequest.isBestseller()),
            detailsRequest.isNewArrival() == null || detailsRequest.isNewArrival(),
            detailsRequest.gender(),
            detailsRequest.seasonalAvailability(),
            detailsRequest.occasion(),
            detailsRequest.recipientType(),
            detailsRequest.ageGroup()
        );
        product.getDetails().configureSeoAndMarketing(
            detailsRequest.tags(),
            detailsRequest.slug(),
            detailsRequest.metaTitle(),
            detailsRequest.metaDescription()
        );
        product.getDetails().configureVendorInfo(
            detailsRequest.vendorSku(),
            detailsRequest.vendorNotes(),
            defaultInt(detailsRequest.fulfillmentTime()),
            Boolean.TRUE.equals(detailsRequest.handmade()),
            Boolean.TRUE.equals(detailsRequest.madeToOrder()),
            Boolean.TRUE.equals(detailsRequest.customizable())
        );
    }

    private int defaultInt(Integer value) {
        return defaultInt(value, 0);
    }

    private int defaultInt(Integer value, int defaultValue) {
        return value == null ? defaultValue : value;
    }

    /**
     * Admin Action: Deactivate a product.
     */
    @PatchMapping("/{productId}/deactivate")
    @PreAuthorize("hasPermission(null, 'DEACTIVATE_PRODUCTS')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID productId) {
        productService.disableProduct(productId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Admin Action: Activate a product.
     */
    @PatchMapping("/{productId}/activate")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PRODUCTS')")
    public ResponseEntity<Void> activate(@PathVariable UUID productId) {
        productService.enableProduct(productId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Vendor Action: Set discount on product
     */
    @PostMapping("/{productId}/discount")
    @PreAuthorize("hasPermission(#productId, 'PRODUCT_OWNER')")
    public ResponseEntity<Void> setDiscount(
            @PathVariable UUID productId,
            @Valid @RequestBody com.giftastic.giftastic.modules.product.dto.SetDiscountRequest request) {
        Product product = productService.getOrThrow(productId);
        product.setDiscount(request.discountPercentage(), request.startDate(), request.endDate());
        productService.updateProduct(productId, product);
        productSearchService.invalidateCacheForProduct(productId);
        log.info("Discount set for product {}: {}%", productId, request.discountPercentage());
        return ResponseEntity.ok().build();
    }
    
    /**
     * Vendor Action: Remove discount from product
     */
    @DeleteMapping("/{productId}/discount")
    @PreAuthorize("hasPermission(#productId, 'PRODUCT_OWNER')")
    public ResponseEntity<Void> removeDiscount(@PathVariable UUID productId) {
        Product product = productService.getOrThrow(productId);
        product.removeDiscount();
        productService.updateProduct(productId, product);
        productSearchService.invalidateCacheForProduct(productId);
        log.info("Discount removed for product {}", productId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Public Action: Fast product search with caching
     */
    @PostMapping("/search")
    public ResponseEntity<Page<com.giftastic.giftastic.modules.product.dto.ProductSearchResponse>> searchProducts(
            @RequestBody com.giftastic.giftastic.modules.product.dto.ProductSearchRequest request) {
        log.debug("Product search request: query={}, page={}, size={}", 
            request.query(), request.page(), request.size());
        Page<com.giftastic.giftastic.modules.product.dto.ProductSearchResponse> results = productSearchService.search(request);
        log.debug("Product search returned {} results", results.getTotalElements());
        return ResponseEntity.ok(results);
    }
}

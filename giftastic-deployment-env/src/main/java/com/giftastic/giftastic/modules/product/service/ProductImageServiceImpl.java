package com.giftastic.giftastic.modules.product.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.giftastic.giftastic.common.security.SecurityUtils;
import com.giftastic.giftastic.common.storage.ObjectStorageService;
import com.giftastic.giftastic.modules.common.ImageUploadProperties;
import com.giftastic.giftastic.modules.common.ImageUploadRules;
import com.giftastic.giftastic.modules.flow.domain.GiftFlow;
import com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductImage;
import com.giftastic.giftastic.modules.product.dto.ProductImageResponse;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorProfileImageRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {

    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final VendorProfileImageRepository vendorProfileImageRepository;
    private final GiftFlowRepository giftFlowRepository;
    private final ObjectStorageService objectStorageService;
    private final ImageUploadProperties imageUploadProperties;

    @Override
    @Transactional
    public ProductImageResponse uploadProductImage(UUID productId, MultipartFile file) {
        ImageUploadRules.validateImageFile(file, imageUploadProperties);
        Product product = requireOwnedProduct(productId);
        if (product.getImages().size() >= imageUploadProperties.getMaxProductImages()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A product can have at most " + imageUploadProperties.getMaxProductImages() + " images.");
        }
        ensureTotalImageSlotsAvailable(product.getSupplierId(), 1);
        ensureStorageAvailable(product.getSupplierId(), file.getSize());

        UUID imageId = UUID.randomUUID();
        String mimeType = ImageUploadRules.normalizeMimeType(file.getContentType());
        String objectKey = "vendors/%s/products/%s/%s".formatted(
                product.getSupplierId(), product.getId(), ImageUploadRules.safeObjectName(imageId, mimeType));

        String url;
        try {
            url = objectStorageService.upload(objectKey, file.getBytes(), mimeType);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image.", ex);
        }

        boolean primary = product.getImages().isEmpty();
        int nextOrder = product.getImages().stream()
                .map(ProductImage::getDisplayOrder)
                .max(Integer::compareTo)
                .orElse(-1) + 1;
        ProductImage image = new ProductImage(
                imageId,
                product.getId(),
                url,
                product.getSupplierId(),
                objectKey,
                ImageUploadRules.normalizeFilename(file.getOriginalFilename()),
                mimeType,
                file.getSize(),
                primary,
                nextOrder,
                LocalDateTime.now());
        product.addImage(image);
        Product saved = productRepository.save(product);
        return ProductImageResponse.from(saved.getId(), findImage(saved, imageId));
    }

    @Override
    public List<ProductImageResponse> listProductImages(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
        return sortedImages(product).stream()
                .map(image -> ProductImageResponse.from(product.getId(), image))
                .toList();
    }

    @Override
    @Transactional
    public List<ProductImageResponse> reorderProductImages(UUID productId, List<UUID> imageIds) {
        Product product = requireOwnedProduct(productId);
        if (imageIds == null || imageIds.size() != product.getImages().size()
                || new HashSet<>(imageIds).size() != imageIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder request must include every product image.");
        }
        for (int index = 0; index < imageIds.size(); index++) {
            findImage(product, imageIds.get(index)).updateDisplayOrder(index);
        }
        Product saved = productRepository.save(product);
        return sortedImages(saved).stream().map(image -> ProductImageResponse.from(saved.getId(), image)).toList();
    }

    @Override
    @Transactional
    public ProductImageResponse setPrimaryImage(UUID productId, UUID imageId) {
        Product product = requireOwnedProduct(productId);
        product.setPrimaryImage(imageId);
        Product saved = productRepository.save(product);
        return ProductImageResponse.from(saved.getId(), findImage(saved, imageId));
    }

    @Override
    @Transactional
    public void deleteProductImage(UUID productId, UUID imageId) {
        Product product = requireOwnedProduct(productId);
        ProductImage image = findImage(product, imageId);
        objectStorageService.delete(image.getObjectKey());
        boolean wasPrimary = image.isPrimary();
        product.removeImage(imageId);
        if (wasPrimary && !product.getImages().isEmpty()) {
            sortedImages(product).get(0).markAsPrimary();
        }
        productRepository.save(product);
    }

    private Product requireOwnedProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
        UUID currentSupplierId = SecurityUtils.getCurrentSupplierId();
        if (currentSupplierId == null || !currentSupplierId.equals(product.getSupplierId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage images for your own products.");
        }
        Vendor vendor = vendorRepository.findBySupplierId(currentSupplierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Vendor profile not found."));
        if (!vendor.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified vendors can upload images.");
        }
        return product;
    }

    private void ensureStorageAvailable(UUID supplierId, long incomingBytes) {
        long productBytes = productRepository.findBySupplierId(supplierId).stream()
                .flatMap(product -> product.getImages().stream())
                .map(ProductImage::getSizeBytes)
                .filter(size -> size != null && size > 0)
                .mapToLong(Long::longValue)
                .sum();
        long profileBytes = vendorProfileImageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(supplierId).stream()
                .mapToLong(image -> Math.max(0L, image.getSizeBytes()))
                .sum();
        long flowBytes = giftFlowRepository.findBySupplierId(supplierId).stream()
                .map(GiftFlow::getImageSizeBytes)
                .filter(size -> size != null && size > 0)
                .mapToLong(Long::longValue)
                .sum();
        if (productBytes + profileBytes + flowBytes + incomingBytes > imageUploadProperties.getMaxVendorStorageBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor image storage limit exceeded.");
        }
    }

    private void ensureTotalImageSlotsAvailable(UUID supplierId, int incomingImages) {
        int currentImages = countVendorImages(supplierId);
        if (currentImages + incomingImages > imageUploadProperties.getMaxVendorTotalImages()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vendor total image limit exceeded. Maximum allowed is "
                            + imageUploadProperties.getMaxVendorTotalImages() + " images.");
        }
    }

    private int countVendorImages(UUID supplierId) {
        int productImages = productRepository.findBySupplierId(supplierId).stream()
                .mapToInt(product -> product.getImages().size())
                .sum();
        int profileImages = vendorProfileImageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(supplierId).size();
        int flowImages = (int) giftFlowRepository.findBySupplierId(supplierId).stream()
                .filter(flow -> flow.getImageObjectKey() != null && !flow.getImageObjectKey().isBlank())
                .count();
        return productImages + profileImages + flowImages;
    }

    private ProductImage findImage(Product product, UUID imageId) {
        return product.getImages().stream()
                .filter(image -> image.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found."));
    }

    private List<ProductImage> sortedImages(Product product) {
        return product.getImages().stream()
                .sorted(Comparator.comparingInt(ProductImage::getDisplayOrder)
                        .thenComparing(ProductImage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }
}

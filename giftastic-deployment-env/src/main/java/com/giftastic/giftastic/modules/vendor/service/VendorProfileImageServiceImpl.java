package com.giftastic.giftastic.modules.vendor.service;

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
import com.giftastic.giftastic.modules.product.domain.ProductImage;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImage;
import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImageType;
import com.giftastic.giftastic.modules.vendor.dto.VendorProfileImageResponse;
import com.giftastic.giftastic.modules.vendor.repository.VendorProfileImageRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VendorProfileImageServiceImpl implements VendorProfileImageService {

    private final VendorRepository vendorRepository;
    private final VendorProfileImageRepository imageRepository;
    private final ProductRepository productRepository;
    private final GiftFlowRepository giftFlowRepository;
    private final ObjectStorageService objectStorageService;
    private final ImageUploadProperties imageUploadProperties;

    @Override
    @Transactional
    public VendorProfileImageResponse uploadProfileImage(VendorProfileImageType type, MultipartFile file) {
        Vendor vendor = requireCurrentVerifiedVendor();
        ImageUploadRules.validateImageFile(file, imageUploadProperties);
        List<VendorProfileImage> currentImages = imageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(vendor.getSupplierId());
        if (currentImages.size() >= imageUploadProperties.getMaxVendorProfileImages()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A vendor profile can have at most " + imageUploadProperties.getMaxVendorProfileImages() + " images.");
        }
        ensureTotalImageSlotsAvailable(vendor.getSupplierId(), 1);
        ensureStorageAvailable(vendor.getSupplierId(), file.getSize(), currentImages);

        UUID imageId = UUID.randomUUID();
        String mimeType = ImageUploadRules.normalizeMimeType(file.getContentType());
        String objectKey = "vendors/%s/profile/%s/%s".formatted(
                vendor.getSupplierId(), type.name().toLowerCase(), ImageUploadRules.safeObjectName(imageId, mimeType));
        String url;
        try {
            url = objectStorageService.upload(objectKey, file.getBytes(), mimeType);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image.", ex);
        }

        int nextOrder = currentImages.stream().map(VendorProfileImage::getSortOrder).max(Integer::compareTo).orElse(-1) + 1;
        VendorProfileImage image = new VendorProfileImage(
                imageId,
                vendor.getSupplierId(),
                type,
                objectKey,
                url,
                ImageUploadRules.normalizeFilename(file.getOriginalFilename()),
                mimeType,
                file.getSize(),
                nextOrder,
                LocalDateTime.now());
        VendorProfileImage saved = imageRepository.save(image);
        if (type == VendorProfileImageType.LOGO || type == VendorProfileImageType.BANNER) {
            vendor.updateProfileImage(type, url);
            vendorRepository.save(vendor);
        }
        return VendorProfileImageResponse.from(saved);
    }

    @Override
    public List<VendorProfileImageResponse> listProfileImages() {
        Vendor vendor = requireCurrentVerifiedVendor();
        return imageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(vendor.getSupplierId()).stream()
                .map(VendorProfileImageResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public List<VendorProfileImageResponse> reorderProfileImages(List<UUID> imageIds) {
        Vendor vendor = requireCurrentVerifiedVendor();
        List<VendorProfileImage> images = imageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(vendor.getSupplierId());
        if (imageIds == null || imageIds.size() != images.size()
                || new HashSet<>(imageIds).size() != imageIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reorder request must include every profile image.");
        }
        for (int index = 0; index < imageIds.size(); index++) {
            findOwnedImage(images, imageIds.get(index)).updateSortOrder(index);
        }
        imageRepository.saveAll(images);
        return images.stream()
                .sorted(Comparator.comparingInt(VendorProfileImage::getSortOrder))
                .map(VendorProfileImageResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void deleteProfileImage(UUID imageId) {
        Vendor vendor = requireCurrentVerifiedVendor();
        List<VendorProfileImage> images = imageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(vendor.getSupplierId());
        VendorProfileImage image = findOwnedImage(images, imageId);
        objectStorageService.delete(image.getObjectKey());
        imageRepository.delete(image);

        if (image.getType() == VendorProfileImageType.LOGO || image.getType() == VendorProfileImageType.BANNER) {
            String replacementUrl = images.stream()
                    .filter(candidate -> !candidate.getId().equals(imageId))
                    .filter(candidate -> candidate.getType() == image.getType())
                    .sorted(Comparator.comparingInt(VendorProfileImage::getSortOrder))
                    .map(VendorProfileImage::getUrl)
                    .findFirst()
                    .orElse(null);
            vendor.updateProfileImage(image.getType(), replacementUrl);
            vendorRepository.save(vendor);
        }
    }

    private Vendor requireCurrentVerifiedVendor() {
        UUID userId = SecurityUtils.getCurrentUserId();
        Vendor vendor = vendorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Vendor profile not found."));
        if (!vendor.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified vendors can manage profile images.");
        }
        return vendor;
    }

    private void ensureStorageAvailable(UUID supplierId, long incomingBytes, List<VendorProfileImage> profileImages) {
        long profileBytes = profileImages.stream().mapToLong(VendorProfileImage::getSizeBytes).sum();
        long productBytes = productRepository.findBySupplierId(supplierId).stream()
                .flatMap(product -> product.getImages().stream())
                .map(ProductImage::getSizeBytes)
                .filter(size -> size != null && size > 0)
                .mapToLong(Long::longValue)
                .sum();
        long flowBytes = giftFlowRepository.findBySupplierId(supplierId).stream()
                .map(GiftFlow::getImageSizeBytes)
                .filter(size -> size != null && size > 0)
                .mapToLong(Long::longValue)
                .sum();
        if (profileBytes + productBytes + flowBytes + incomingBytes > imageUploadProperties.getMaxVendorStorageBytes()) {
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
        int profileImages = imageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(supplierId).size();
        int productImages = productRepository.findBySupplierId(supplierId).stream()
                .mapToInt(product -> product.getImages().size())
                .sum();
        int flowImages = (int) giftFlowRepository.findBySupplierId(supplierId).stream()
                .filter(flow -> flow.getImageObjectKey() != null && !flow.getImageObjectKey().isBlank())
                .count();
        return profileImages + productImages + flowImages;
    }

    private VendorProfileImage findOwnedImage(List<VendorProfileImage> images, UUID imageId) {
        return images.stream()
                .filter(image -> image.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found."));
    }
}

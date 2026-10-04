package com.giftastic.giftastic.modules.flow.service;

import java.io.IOException;
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
import com.giftastic.giftastic.modules.flow.dto.GiftFlowImageResponse;
import com.giftastic.giftastic.modules.flow.repository.GiftFlowRepository;
import com.giftastic.giftastic.modules.product.domain.ProductImage;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorProfileImageRepository;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GiftFlowImageServiceImpl implements GiftFlowImageService {

    private final GiftFlowRepository giftFlowRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final VendorProfileImageRepository vendorProfileImageRepository;
    private final ObjectStorageService objectStorageService;
    private final ImageUploadProperties imageUploadProperties;

    @Override
    @Transactional
    public GiftFlowImageResponse uploadFlowImage(UUID flowId, MultipartFile file) {
        GiftFlow flow = requireOwnedFlow(flowId);
        ImageUploadRules.validateImageFile(file, imageUploadProperties);
        if (imageUploadProperties.getMaxGiftFlowImages() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gift flow image uploads are disabled.");
        }

        int incomingImageCount = flow.getImageObjectKey() == null || flow.getImageObjectKey().isBlank() ? 1 : 0;
        ensureTotalImageSlotsAvailable(flow.getSupplierId(), incomingImageCount);
        long existingFlowImageBytes = flow.getImageSizeBytes() == null ? 0L : flow.getImageSizeBytes();
        ensureStorageAvailable(flow.getSupplierId(), file.getSize() - existingFlowImageBytes);

        UUID imageId = UUID.randomUUID();
        String mimeType = ImageUploadRules.normalizeMimeType(file.getContentType());
        String objectKey = "vendors/%s/flows/%s/%s".formatted(
                flow.getSupplierId(), flow.getId(), ImageUploadRules.safeObjectName(imageId, mimeType));

        String previousObjectKey = flow.getImageObjectKey();
        String url;
        try {
            url = objectStorageService.upload(objectKey, file.getBytes(), mimeType);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image.", ex);
        }

        if (previousObjectKey != null && !previousObjectKey.isBlank()) {
            objectStorageService.delete(previousObjectKey);
        }
        flow.updateImage(
                url,
                objectKey,
                ImageUploadRules.normalizeFilename(file.getOriginalFilename()),
                mimeType,
                file.getSize());
        return GiftFlowImageResponse.from(giftFlowRepository.save(flow));
    }

    @Override
    @Transactional
    public void deleteFlowImage(UUID flowId) {
        GiftFlow flow = requireOwnedFlow(flowId);
        objectStorageService.delete(flow.getImageObjectKey());
        flow.clearImage();
        giftFlowRepository.save(flow);
    }

    private GiftFlow requireOwnedFlow(UUID flowId) {
        GiftFlow flow = giftFlowRepository.findById(flowId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gift flow not found."));
        UUID currentSupplierId = SecurityUtils.getCurrentSupplierId();
        if (currentSupplierId == null || !currentSupplierId.equals(flow.getSupplierId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage images for your own gift flows.");
        }
        Vendor vendor = vendorRepository.findBySupplierId(currentSupplierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Vendor profile not found."));
        if (!vendor.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified vendors can upload images.");
        }
        return flow;
    }

    private void ensureStorageAvailable(UUID supplierId, long incomingDeltaBytes) {
        if (incomingDeltaBytes <= 0) {
            return;
        }
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
        if (productBytes + profileBytes + flowBytes + incomingDeltaBytes > imageUploadProperties.getMaxVendorStorageBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor image storage limit exceeded.");
        }
    }

    private void ensureTotalImageSlotsAvailable(UUID supplierId, int incomingImages) {
        if (incomingImages <= 0) {
            return;
        }
        int currentImages = countVendorImages(supplierId);
        if (currentImages + incomingImages > imageUploadProperties.getMaxVendorTotalImages()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vendor total image limit exceeded. Maximum allowed is "
                            + imageUploadProperties.getMaxVendorTotalImages() + " images.");
        }
    }

    private int countVendorImages(UUID supplierId) {
        int flowImages = (int) giftFlowRepository.findBySupplierId(supplierId).stream()
                .filter(flow -> flow.getImageObjectKey() != null && !flow.getImageObjectKey().isBlank())
                .count();
        int productImages = productRepository.findBySupplierId(supplierId).stream()
                .mapToInt(product -> product.getImages().size())
                .sum();
        int profileImages = vendorProfileImageRepository.findByVendorIdOrderBySortOrderAscCreatedAtAsc(supplierId).size();
        return flowImages + productImages + profileImages;
    }
}

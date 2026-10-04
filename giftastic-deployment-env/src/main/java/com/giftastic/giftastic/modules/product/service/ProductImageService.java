package com.giftastic.giftastic.modules.product.service;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.giftastic.giftastic.modules.product.dto.ProductImageResponse;

public interface ProductImageService {

    ProductImageResponse uploadProductImage(UUID productId, MultipartFile file);

    List<ProductImageResponse> listProductImages(UUID productId);

    List<ProductImageResponse> reorderProductImages(UUID productId, List<UUID> imageIds);

    ProductImageResponse setPrimaryImage(UUID productId, UUID imageId);

    void deleteProductImage(UUID productId, UUID imageId);
}

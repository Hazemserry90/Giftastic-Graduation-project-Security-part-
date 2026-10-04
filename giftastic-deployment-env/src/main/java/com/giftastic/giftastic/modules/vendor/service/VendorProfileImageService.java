package com.giftastic.giftastic.modules.vendor.service;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.giftastic.giftastic.modules.vendor.domain.VendorProfileImageType;
import com.giftastic.giftastic.modules.vendor.dto.VendorProfileImageResponse;

public interface VendorProfileImageService {

    VendorProfileImageResponse uploadProfileImage(VendorProfileImageType type, MultipartFile file);

    List<VendorProfileImageResponse> listProfileImages();

    List<VendorProfileImageResponse> reorderProfileImages(List<UUID> imageIds);

    void deleteProfileImage(UUID imageId);
}

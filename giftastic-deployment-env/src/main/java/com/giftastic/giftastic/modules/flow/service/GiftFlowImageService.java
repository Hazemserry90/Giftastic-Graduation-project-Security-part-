package com.giftastic.giftastic.modules.flow.service;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.giftastic.giftastic.modules.flow.dto.GiftFlowImageResponse;

public interface GiftFlowImageService {

    GiftFlowImageResponse uploadFlowImage(UUID flowId, MultipartFile file);

    void deleteFlowImage(UUID flowId);
}

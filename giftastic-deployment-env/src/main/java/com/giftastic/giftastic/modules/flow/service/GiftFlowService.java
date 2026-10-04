package com.giftastic.giftastic.modules.flow.service;

import java.util.List;
import java.util.UUID;

import com.giftastic.giftastic.modules.flow.domain.GiftFlow;

import jakarta.transaction.Transactional;

public interface GiftFlowService {

    @Transactional
    GiftFlow createFlow(UUID supplierId, String name, String description, String imageUrl, String configuration);

    @Transactional
    GiftFlow updateFlow(UUID flowId, UUID supplierId, String name, String description, String imageUrl, String configuration);

    @Transactional
    void deleteFlow(UUID flowId, UUID supplierId);

    GiftFlow getFlow(UUID flowId);
    GiftFlow getFlowForViewing(UUID flowId);
    List<GiftFlow> getFlowsBySupplier(UUID supplierId);
    List<GiftFlow> getFlowsBySupplierForViewing(UUID supplierId);
    List<GiftFlow> getAllFlows();
    List<GiftFlow> getDiscoverableFlows();
    boolean isFlowDiscoverable(GiftFlow flow);
}

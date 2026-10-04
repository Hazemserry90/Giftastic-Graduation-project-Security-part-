package com.giftastic.giftastic.modules.flow.controller;

import java.util.List;
import java.util.UUID;

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

import com.giftastic.giftastic.common.config.OrderFlowConfig;
import com.giftastic.giftastic.modules.flow.domain.GiftFlow;
import com.giftastic.giftastic.modules.flow.dto.CreateGiftFlowRequest;
import com.giftastic.giftastic.modules.flow.dto.GiftFlowImageResponse;
import com.giftastic.giftastic.modules.flow.dto.GiftFlowLimitsResponse;
import com.giftastic.giftastic.modules.flow.dto.GiftFlowResponse;
import com.giftastic.giftastic.modules.flow.dto.UpdateGiftFlowRequest;
import com.giftastic.giftastic.modules.flow.service.GiftFlowImageService;
import com.giftastic.giftastic.modules.flow.service.GiftFlowService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/flows")
@RequiredArgsConstructor
@Tag(name = "Gift Flows", description = "Gift flow configuration and management endpoints")
@SecurityRequirement(name = "bearer-jwt")
@Slf4j
public class GiftFlowController {

    private final GiftFlowService giftFlowService;
    private final GiftFlowImageService giftFlowImageService;
    private final OrderFlowConfig orderFlowConfig;

    @GetMapping("/limits")
    public ResponseEntity<GiftFlowLimitsResponse> getFlowLimits() {
        return ResponseEntity.ok(new GiftFlowLimitsResponse(
                orderFlowConfig.getMaxGiftFlowsPerVendor(),
                orderFlowConfig.getMaxGiftFlowSteps()));
    }

    @PostMapping
    @PreAuthorize("hasPermission(#supplierId, 'VENDOR_OWNER')")
    public ResponseEntity<GiftFlowResponse> createFlow(
            @RequestParam UUID supplierId,
            @RequestBody CreateGiftFlowRequest request) {
        GiftFlow flow = giftFlowService.createFlow(
                supplierId, request.name(), request.description(), null, request.configuration());
        return ResponseEntity.ok(GiftFlowResponse.from(flow));
    }

    @PatchMapping("/{flowId}")
    @PreAuthorize("hasPermission(#supplierId, 'VENDOR_OWNER')")
    @Operation(
        summary = "Update gift flow",
        description = "Updates an existing gift flow configuration. Requires VENDOR_OWNER permission for the supplierId."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Gift flow updated successfully", 
                     content = @Content(schema = @Schema(implementation = GiftFlowResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid flow configuration"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Flow or supplier not found")
    })
    public ResponseEntity<GiftFlowResponse> updateFlow(
            @Parameter(description = "ID of the gift flow", required = true)
            @PathVariable UUID flowId,
            @Parameter(description = "ID of the supplier/vendor", required = true)
            @RequestParam UUID supplierId,
            @Parameter(description = "Gift flow update request", required = true)
            @RequestBody UpdateGiftFlowRequest request) {
        GiftFlow flow = giftFlowService.updateFlow(
                flowId, supplierId, request.name(), request.description(), null, request.configuration());
        return ResponseEntity.ok(GiftFlowResponse.from(flow));
    }

    @PostMapping(value = "/{flowId}/image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<GiftFlowImageResponse> uploadFlowImage(
            @PathVariable UUID flowId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(giftFlowImageService.uploadFlowImage(flowId, file));
    }

    @DeleteMapping("/{flowId}/image")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteFlowImage(@PathVariable UUID flowId) {
        giftFlowImageService.deleteFlowImage(flowId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{flowId}")
    @PreAuthorize("hasPermission(#supplierId, 'VENDOR_OWNER')")
    @Operation(
        summary = "Delete gift flow",
        description = "Deletes a gift flow configuration. Requires VENDOR_OWNER permission for the supplierId."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Gift flow deleted successfully"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Flow or supplier not found")
    })
    public ResponseEntity<Void> deleteFlow(
            @Parameter(description = "ID of the gift flow", required = true)
            @PathVariable UUID flowId,
            @Parameter(description = "ID of the supplier/vendor", required = true)
            @RequestParam UUID supplierId) {
        giftFlowService.deleteFlow(flowId, supplierId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{flowId}")
    @Operation(
        summary = "Get gift flow by ID",
        description = "Retrieves a specific gift flow configuration by its ID. Public endpoint - no authentication required."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Gift flow retrieved successfully", 
                     content = @Content(schema = @Schema(implementation = GiftFlowResponse.class))),
        @ApiResponse(responseCode = "404", description = "Gift flow not found")
    })
    public ResponseEntity<GiftFlowResponse> getFlow(
            @Parameter(description = "ID of the gift flow", required = true)
            @PathVariable UUID flowId) {
        GiftFlow flow = giftFlowService.getFlowForViewing(flowId);
        return ResponseEntity.ok(GiftFlowResponse.from(flow));
    }

    @GetMapping("/vendor/{supplierId}")
    @Operation(
        summary = "Get vendor gift flows",
        description = "Retrieves all gift flows for a specific vendor/supplier. Public endpoint - no authentication required."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vendor gift flows retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Vendor not found")
    })
    public ResponseEntity<List<GiftFlowResponse>> getVendorFlows(
            @Parameter(description = "ID of the vendor/supplier", required = true)
            @PathVariable UUID supplierId) {
        log.info("Fetching gift flows for vendor: supplierId={}", supplierId);
        
        try {
            List<GiftFlowResponse> flows = giftFlowService.getFlowsBySupplierForViewing(supplierId).stream()
                    .map(GiftFlowResponse::from).toList();
            log.info("Found {} gift flows for vendor {}", flows.size(), supplierId);
            return ResponseEntity.ok(flows);
        } catch (Exception e) {
            log.error("Failed to fetch gift flows for vendor {}: {}", supplierId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping
    @Operation(
        summary = "Get all gift flows",
        description = "Retrieves all available gift flow configurations. Public endpoint - no authentication required."
    )
    public ResponseEntity<List<GiftFlowResponse>> getAllFlows() {
        List<GiftFlowResponse> flows = giftFlowService.getDiscoverableFlows().stream()
                .map(GiftFlowResponse::from).toList();
        return ResponseEntity.ok(flows);
    }
}

package com.giftastic.giftastic.modules.admin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.giftastic.giftastic.modules.category.domain.Category;
import com.giftastic.giftastic.modules.category.repository.CategoryRepository;
import com.giftastic.giftastic.modules.product.domain.Product;
import com.giftastic.giftastic.modules.product.domain.ProductStatus;
import com.giftastic.giftastic.modules.product.repository.ProductRepository;
import com.giftastic.giftastic.modules.user.domain.User;
import com.giftastic.giftastic.modules.user.repository.UserRepository;
import com.giftastic.giftastic.modules.vendor.domain.Vendor;
import com.giftastic.giftastic.modules.vendor.repository.VendorRepository;
import com.giftastic.giftastic.modules.admin.dto.AdminPermissionSummaryResponse;
import com.giftastic.giftastic.modules.admin.service.AdminService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Endpoints for the admin control panel")
@SecurityRequirement(name = "bearer-jwt")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final com.giftastic.giftastic.modules.admin.repository.AdminRepository adminRepository;
    private final AdminService adminService;
    private final com.giftastic.giftastic.modules.notification.service.NotificationService notificationService;
    private final com.giftastic.giftastic.modules.admin.service.PlatformAnalyticsService platformAnalyticsService;

    /** Read-only user list – VIEW_USERS is sufficient (least privilege). */
    @GetMapping("/users")
    @PreAuthorize("hasPermission(null, 'VIEW_USERS')")
    @Operation(summary = "Get all users for management (read-only)")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /** Vendor applications awaiting review – requires ACTIVATE_VENDORS. */
    @GetMapping("/pending-vendors")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_VENDORS')")
    @Operation(summary = "Get unverified vendor applications")
    public ResponseEntity<List<Vendor>> getPendingVendors() {
        return ResponseEntity.ok(vendorRepository.findByIsVerifiedFalse());
    }

    /** Products awaiting approval – requires ACTIVATE_PRODUCTS. */
    @GetMapping("/pending-products")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PRODUCTS')")
    @Operation(summary = "Get products awaiting approval")
    public ResponseEntity<Page<Product>> getPendingProducts(Pageable pageable) {
        return ResponseEntity.ok(productRepository.findByStatus(ProductStatus.PENDING_APPROVAL, pageable));
    }

    /** Draft products that can be approved – requires ACTIVATE_PRODUCTS. */
    @GetMapping("/draft-products")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PRODUCTS')")
    @Operation(summary = "Get draft products that can be approved")
    public ResponseEntity<Page<Product>> getDraftProducts(Pageable pageable) {
        return ResponseEntity.ok(productRepository.findByStatus(ProductStatus.DRAFT, pageable));
    }

    @GetMapping("/products")
    @PreAuthorize("hasPermission(null, 'ACTIVATE_PRODUCTS')")
    @Operation(summary = "Get products across all statuses for management")
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) ProductStatus status,
            Pageable pageable) {
        Page<Product> products = status == null
                ? productRepository.findAll(pageable)
                : productRepository.findByStatus(status, pageable);
        return ResponseEntity.ok(products);
    }

    /** All categories – requires MANAGE_CATEGORIES. */
    @GetMapping("/categories")
    @PreAuthorize("hasPermission(null, 'MANAGE_CATEGORIES')")
    @Operation(summary = "Get all categories for management")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    /** Platform-wide stats – SUPER_ADMIN only. */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission(null, 'SUPER_ADMIN')")
    @Operation(summary = "Get global platform statistics")
    public ResponseEntity<Map<String, Long>> getGlobalStats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepository.count(),
                "totalVendors", vendorRepository.count(),
                "totalProducts", productRepository.count()));
    }

    @GetMapping("/admin-requests")
    @PreAuthorize("hasPermission(null, 'REVIEW_ADMIN_REQUESTS')")
    @Operation(summary = "Get users who requested admin role")
    public ResponseEntity<List<User>> getAdminRequests() {
        return ResponseEntity.ok(userRepository.findByRequestedAdmin(true));
    }

    /** View all admins – requires MANAGE_ADMIN_PERMISSIONS. */
    @GetMapping("/admins")
    @PreAuthorize("hasPermission(null, 'MANAGE_ADMIN_PERMISSIONS')")
    @Operation(summary = "Get all admin profiles")
    public ResponseEntity<List<AdminPermissionSummaryResponse>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdminProfiles());
    }

    /** Send notifications – requires SEND_NOTIFICATIONS. */
    @PostMapping("/notifications/send")
    @PreAuthorize("hasPermission(null, 'SEND_NOTIFICATIONS')")
    @Operation(summary = "Send a notification to users")
    public ResponseEntity<Void> sendNotification(
            @org.springframework.web.bind.annotation.RequestBody com.giftastic.giftastic.modules.admin.dto.SendNotificationRequest request) {
        if ("ALL_USERS".equals(request.target())) {
            userRepository.findAll()
                    .forEach(u -> notificationService.sendNotification(u.getId(), request.title(), request.message(),
                            com.giftastic.giftastic.modules.notification.domain.NotificationType.SYSTEM_ALERT, null));
        } else if ("ALL_ADMINS".equals(request.target())) {
            adminRepository.findAll().forEach(
                    a -> notificationService.sendNotification(a.getUserId(), request.title(), request.message(),
                            com.giftastic.giftastic.modules.notification.domain.NotificationType.SYSTEM_ALERT, null));
        } else if (request.targetId() != null) {
            notificationService.sendNotification(request.targetId(), request.title(), request.message(),
                    com.giftastic.giftastic.modules.notification.domain.NotificationType.SYSTEM_ALERT, null);
        }
        return ResponseEntity.ok().build();
    }

    /** Platform analytics – requires VIEW_FINANCIAL_ANALYTICS. */
    @GetMapping("/analytics/platform")
    @PreAuthorize("hasPermission(null, 'VIEW_FINANCIAL_ANALYTICS')")
    @Operation(summary = "Get platform-wide analytics including top products, customers, and vendors")
    public ResponseEntity<com.giftastic.giftastic.modules.admin.dto.PlatformAnalyticsDTO> getPlatformAnalytics() {
        return ResponseEntity.ok(platformAnalyticsService.getPlatformAnalytics());
    }
}

package com.giftastic.giftastic.modules.admin.domain;

/**
 * Fine-grained permission flags following the least-privilege principle.
 *
 * Permissions are grouped by domain. Read permissions are separate from write
 * permissions so a moderator can be given only the minimum they need.
 *
 * User is the archetype – SUPER_ADMIN is a type of user (with all permissions).
 */
public enum AdminPermission {

    // ── User domain ────────────────────────────────────────────────────────────
    /** View the full user list and individual profiles (read-only). */
    VIEW_USERS,
    /** Edit user metadata (name, phone, etc.) on behalf of a user. */
    MANAGE_USERS,
    /** Hard-delete a user account and all associated data. */
    DELETE_USERS,
    /** Ban (suspend) a user account. */
    BAN_USERS,
    /** Lift a ban from a user account. */
    UNBAN_USERS,
    /** Review and approve/reject admin-role requests from regular users. */
    REVIEW_ADMIN_REQUESTS,

    // ── Admin / staff domain ───────────────────────────────────────────────────
    /** Promote a regular user to the admin role (creates an Admin record). */
    MAKE_ADMINS,
    /** Demote an admin back to a regular user (deletes the Admin record). */
    DEMOTE_ADMINS,
    /** Grant or revoke individual permissions on another admin account. */
    MANAGE_ADMIN_PERMISSIONS,

    // ── Vendor domain ──────────────────────────────────────────────────────────
    /** Promote a user to the vendor role (creates a Vendor record). */
    MAKE_VENDORS,
    /** Activate (verify) a pending vendor application. */
    ACTIVATE_VENDORS,
    /** Suspend / deactivate a vendor's storefront. */
    DEACTIVATE_VENDORS,

    // ── Product domain ─────────────────────────────────────────────────────────
    /** Approve a product that is pending review, making it publicly visible. */
    ACTIVATE_PRODUCTS,
    /** Reject a product pending review, returning it to the vendor. */
    REJECT_PRODUCTS,
    /** Deactivate (hide) a live product without deleting it. */
    DEACTIVATE_PRODUCTS,
    /** Permanently delete a product and its associated data. */
    DELETE_PRODUCTS,

    // ── Category domain ────────────────────────────────────────────────────────
    /** Create, rename, or update categories. */
    MANAGE_CATEGORIES,

    // ── Order domain ───────────────────────────────────────────────────────────
    /** Read order data for support and analytics (read-only). */
    VIEW_ORDERS,
    /** Update order status, process refunds, or cancel orders. */
    MANAGE_ORDERS,
    /** Change order status to any value (admin override). */
    MANAGE_ORDER_STATUS,
    /** Review and respond to vendor assistance requests for orders. */
    REVIEW_ORDER_ASSISTANCE,
    /** Confirm or reject Instapay transaction IDs for an order. */
    CONFIRM_ORDER_PAYMENTS,

    // ── Financial / Commission domain ──────────────────────────────────────────
    /** View financial information (order totals, vendor earnings, commissions). */
    VIEW_FINANCIAL_DATA,
    /** Create and manage commission rates and rules. */
    MANAGE_COMMISSIONS,
    /** Review and approve/reject vendor commission payment proofs. */
    REVIEW_COMMISSION_PAYMENTS,
    /** Send payment reminders to vendors for unpaid commissions. */
    URGE_COMMISSION_PAYMENT,
    /** Submit platform-to-vendor payout proof for confirmed Instapay orders. */
    MANAGE_VENDOR_PAYOUTS,
    /** Access comprehensive financial analytics and reports. */
    VIEW_FINANCIAL_ANALYTICS,

    // ── Gift-flow domain ───────────────────────────────────────────────────────
    /** Review and curate gift-flow templates visible to all users. */
    MANAGE_GIFT_FLOWS,

    // ── Platform-wide ──────────────────────────────────────────────────────────
    /** Send system notifications to users and admins. */
    SEND_NOTIFICATIONS,
    /** Review and manage user reports (products, users, vendors, etc.). */
    MANAGE_REPORTS,

    // ── Review & Feedback domain ───────────────────────────────────────────────
    /** View all reviews and feedback (read-only access for moderators). */
    VIEW_REVIEWS,
    /** Approve or reject reviews pending moderation. */
    MODERATE_REVIEWS,
    /** View anonymous vendor feedback submitted by customers. */
    VIEW_VENDOR_FEEDBACK,
    /** Mute or unmute users from submitting reviews or comments. */
    MUTE_USERS,

    /**
     * Super-admin sentinel – bypasses all permission checks.
     * Implies every other permission. Assign sparingly.
     */
    SUPER_ADMIN
}

export const USER_PERMISSION_META = Object.freeze({
  VIEW_USERS: { label: 'View Users', icon: 'group', group: 'Users', color: '#341547' },
  MANAGE_USERS: { label: 'Manage Users', icon: 'manage_accounts', group: 'Users', color: '#341547' },
  DELETE_USERS: { label: 'Delete Users', icon: 'person_remove', group: 'Users', color: '#ef4444' },
  BAN_USERS: { label: 'Ban Users', icon: 'block', group: 'Users', color: '#f59e0b' },
  UNBAN_USERS: { label: 'Unban Users', icon: 'lock_open', group: 'Users', color: '#10b981' },
  REVIEW_ADMIN_REQUESTS: { label: 'Review Admin Requests', icon: 'admin_panel_settings', group: 'Users', color: '#735186' },
  MAKE_ADMINS: { label: 'Make Admins', icon: 'shield_person', group: 'Admins', color: '#735186' },
  DEMOTE_ADMINS: { label: 'Demote Admins', icon: 'shield_minus', group: 'Admins', color: '#ef4444' },
  MANAGE_ADMIN_PERMISSIONS: { label: 'Manage Permissions', icon: 'key', group: 'Admins', color: '#735186' },
  MAKE_VENDORS: { label: 'Make Vendors', icon: 'storefront', group: 'Vendors', color: '#0c6b5b' },
  ACTIVATE_VENDORS: { label: 'Activate Vendors', icon: 'verified', group: 'Vendors', color: '#10b981' },
  DEACTIVATE_VENDORS: { label: 'Deactivate Vendors', icon: 'store_off', group: 'Vendors', color: '#f59e0b' },
  ACTIVATE_PRODUCTS: { label: 'Approve Products', icon: 'check_circle', group: 'Products', color: '#10b981' },
  REJECT_PRODUCTS: { label: 'Reject Products', icon: 'cancel', group: 'Products', color: '#ef4444' },
  DEACTIVATE_PRODUCTS: { label: 'Deactivate Products', icon: 'visibility_off', group: 'Products', color: '#f59e0b' },
  DELETE_PRODUCTS: { label: 'Delete Products', icon: 'delete_forever', group: 'Products', color: '#ef4444' },
  MANAGE_CATEGORIES: { label: 'Manage Categories', icon: 'category', group: 'Categories', color: '#8a4b16' },
  VIEW_ORDERS: { label: 'View Orders', icon: 'receipt_long', group: 'Orders', color: '#341547' },
  MANAGE_ORDERS: { label: 'Manage Orders', icon: 'package_2', group: 'Orders', color: '#735186' },
  CONFIRM_ORDER_PAYMENTS: { label: 'Confirm Order Payments', icon: 'verified', group: 'Orders', color: '#10b981' },
  MANAGE_GIFT_FLOWS: { label: 'Manage Gift Flows', icon: 'card_giftcard', group: 'Gift Flows', color: '#ec4899' },
  MANAGE_REPORTS: { label: 'Manage Reports', icon: 'flag', group: 'Reports', color: '#ef4444' },
  VIEW_REVIEWS: { label: 'View Reviews', icon: 'rate_review', group: 'Reviews', color: '#341547' },
  MODERATE_REVIEWS: { label: 'Moderate Reviews', icon: 'gavel', group: 'Reviews', color: '#735186' },
  VIEW_VENDOR_FEEDBACK: { label: 'View Vendor Feedback', icon: 'feedback', group: 'Reviews', color: '#0c6b5b' },
  MUTE_USERS: { label: 'Mute Users', icon: 'volume_off', group: 'Reviews', color: '#f59e0b' },
  SEND_NOTIFICATIONS: { label: 'Send Notifications', icon: 'campaign', group: 'Platform', color: '#0c6b5b' },
  VIEW_FINANCIAL_DATA: { label: 'View Financial Data', icon: 'payments', group: 'Financial', color: '#0c6b5b' },
  VIEW_FINANCIAL_ANALYTICS: { label: 'View Financial Analytics', icon: 'monitoring', group: 'Financial', color: '#341547' },
  MANAGE_COMMISSIONS: { label: 'Manage Commissions', icon: 'rule', group: 'Financial', color: '#735186' },
  REVIEW_COMMISSION_PAYMENTS: { label: 'Review Commission Payments', icon: 'fact_check', group: 'Financial', color: '#10b981' },
  URGE_COMMISSION_PAYMENT: { label: 'Urge Commission Payment', icon: 'notifications_active', group: 'Financial', color: '#f59e0b' },
  MANAGE_VENDOR_PAYOUTS: { label: 'Manage Vendor Payouts', icon: 'account_balance', group: 'Financial', color: '#10b981' },
  SUPER_ADMIN: { label: 'Super Admin', icon: 'workspace_premium', group: 'Platform', color: '#f59e0b' },
});

export const USER_PERMISSION_GROUPS = Object.freeze([
  'Platform', 'Users', 'Admins', 'Vendors', 'Products', 'Categories',
  'Orders', 'Financial', 'Gift Flows', 'Reviews', 'Reports',
]);

export const getUserPermissionLabel = (permission) =>
  USER_PERMISSION_META[permission]?.label || permission;

import * as UserViews from './user/views/UserSemanticViews';
import * as VendorViews from './vendor/views/VendorSemanticViews';
import * as ProductViews from './product/views/ProductSemanticViews';
import * as OrderViews from './order/views/OrderSemanticViews';
import * as GiftFlowViews from './giftFlow/views/GiftFlowSemanticViews';
import * as CartViews from './cart/views/CartSemanticViews';
import * as ReviewViews from './review/views/ReviewSemanticViews';
import * as CategoryViews from './category/views/CategorySemanticViews';
import * as VendorApplicationViews from './vendorApplication/views/VendorApplicationSemanticViews';
import * as CommissionViews from './commission/views/CommissionSemanticViews';
import * as CommissionPaymentRequestViews from './commissionPaymentRequest/views/CommissionPaymentRequestSemanticViews';
import * as CommissionRuleViews from './commissionRule/views/CommissionRuleSemanticViews';
import * as ReportViews from './report/views/ReportSemanticViews';
import * as AdminRequestViews from './adminRequest/views/AdminRequestSemanticViews';
import * as OrderAssistanceViews from './orderAssistance/views/OrderAssistanceSemanticViews';
import * as NotificationViews from './notification/views/NotificationSemanticViews';
import * as VendorFeedbackViews from './vendorFeedback/views/VendorFeedbackSemanticViews';
import * as DeliveryZoneViews from './deliveryZone/views/DeliveryZoneSemanticViews';
import * as VendorDeliveryPricingViews from './vendorDeliveryPricing/views/VendorDeliveryPricingSemanticViews';
import * as ReminderViews from './reminder/views/ReminderSemanticViews';
import * as VendorActivityViews from './vendorActivity/views/VendorActivitySemanticViews';
import * as UserReviewRestrictionViews from './userReviewRestriction/views/UserReviewRestrictionSemanticViews';
import * as FavoriteViews from './favorite/views/FavoriteSemanticViews';

export const SEMANTIC_VIEW_REGISTRY = Object.freeze({
  user: Object.freeze({ Summary: UserViews.UserSummary, Card: UserViews.UserCard, Row: UserViews.UserRow, Details: UserViews.UserDetails, Workflow: UserViews.UserWorkflow, sections: UserViews.USER_VIEW_SECTIONS }),
  vendor: Object.freeze({ Summary: VendorViews.VendorSummary, Card: VendorViews.VendorCard, Row: VendorViews.VendorRow, Details: VendorViews.VendorDetails, Workflow: VendorViews.VendorWorkflow, sections: VendorViews.VENDOR_VIEW_SECTIONS }),
  product: Object.freeze({ Summary: ProductViews.ProductSummary, Card: ProductViews.ProductCard, Row: ProductViews.ProductRow, Details: ProductViews.ProductDetails, Workflow: ProductViews.ProductWorkflow, sections: ProductViews.PRODUCT_VIEW_SECTIONS }),
  order: Object.freeze({ Summary: OrderViews.OrderSummary, Card: OrderViews.OrderCard, Row: OrderViews.OrderRow, Details: OrderViews.OrderDetails, Workflow: OrderViews.OrderWorkflow, sections: OrderViews.ORDER_VIEW_SECTIONS }),
  giftFlow: Object.freeze({ Summary: GiftFlowViews.GiftFlowSummary, Card: GiftFlowViews.GiftFlowCard, Row: GiftFlowViews.GiftFlowRow, Details: GiftFlowViews.GiftFlowDetails, Workflow: GiftFlowViews.GiftFlowWorkflow, sections: GiftFlowViews.GIFTFLOW_VIEW_SECTIONS }),
  cart: Object.freeze({ Summary: CartViews.CartSummary, Card: CartViews.CartCard, Row: CartViews.CartRow, Details: CartViews.CartDetails, Workflow: CartViews.CartWorkflow, sections: CartViews.CART_VIEW_SECTIONS }),
  review: Object.freeze({ Summary: ReviewViews.ReviewSummary, Card: ReviewViews.ReviewCard, Row: ReviewViews.ReviewRow, Details: ReviewViews.ReviewDetails, Workflow: ReviewViews.ReviewWorkflow, sections: ReviewViews.REVIEW_VIEW_SECTIONS }),
  category: Object.freeze({ Summary: CategoryViews.CategorySummary, Card: CategoryViews.CategoryCard, Row: CategoryViews.CategoryRow, Details: CategoryViews.CategoryDetails, Workflow: CategoryViews.CategoryWorkflow, sections: CategoryViews.CATEGORY_VIEW_SECTIONS }),
  vendorApplication: Object.freeze({ Summary: VendorApplicationViews.VendorApplicationSummary, Card: VendorApplicationViews.VendorApplicationCard, Row: VendorApplicationViews.VendorApplicationRow, Details: VendorApplicationViews.VendorApplicationDetails, Workflow: VendorApplicationViews.VendorApplicationWorkflow, sections: VendorApplicationViews.VENDORAPPLICATION_VIEW_SECTIONS }),
  commission: Object.freeze({ Summary: CommissionViews.CommissionSummary, Card: CommissionViews.CommissionCard, Row: CommissionViews.CommissionRow, Details: CommissionViews.CommissionDetails, Workflow: CommissionViews.CommissionWorkflow, sections: CommissionViews.COMMISSION_VIEW_SECTIONS }),
  commissionPaymentRequest: Object.freeze({ Summary: CommissionPaymentRequestViews.CommissionPaymentRequestSummary, Card: CommissionPaymentRequestViews.CommissionPaymentRequestCard, Row: CommissionPaymentRequestViews.CommissionPaymentRequestRow, Details: CommissionPaymentRequestViews.CommissionPaymentRequestDetails, Workflow: CommissionPaymentRequestViews.CommissionPaymentRequestWorkflow, sections: CommissionPaymentRequestViews.COMMISSIONPAYMENTREQUEST_VIEW_SECTIONS }),
  commissionRule: Object.freeze({ Summary: CommissionRuleViews.CommissionRuleSummary, Card: CommissionRuleViews.CommissionRuleCard, Row: CommissionRuleViews.CommissionRuleRow, Details: CommissionRuleViews.CommissionRuleDetails, Workflow: CommissionRuleViews.CommissionRuleWorkflow, sections: CommissionRuleViews.COMMISSIONRULE_VIEW_SECTIONS }),
  report: Object.freeze({ Summary: ReportViews.ReportSummary, Card: ReportViews.ReportCard, Row: ReportViews.ReportRow, Details: ReportViews.ReportDetails, Workflow: ReportViews.ReportWorkflow, sections: ReportViews.REPORT_VIEW_SECTIONS }),
  adminRequest: Object.freeze({ Summary: AdminRequestViews.AdminRequestSummary, Card: AdminRequestViews.AdminRequestCard, Row: AdminRequestViews.AdminRequestRow, Details: AdminRequestViews.AdminRequestDetails, Workflow: AdminRequestViews.AdminRequestWorkflow, sections: AdminRequestViews.ADMINREQUEST_VIEW_SECTIONS }),
  orderAssistance: Object.freeze({ Summary: OrderAssistanceViews.OrderAssistanceSummary, Card: OrderAssistanceViews.OrderAssistanceCard, Row: OrderAssistanceViews.OrderAssistanceRow, Details: OrderAssistanceViews.OrderAssistanceDetails, Workflow: OrderAssistanceViews.OrderAssistanceWorkflow, sections: OrderAssistanceViews.ORDERASSISTANCE_VIEW_SECTIONS }),
  notification: Object.freeze({ Summary: NotificationViews.NotificationSummary, Card: NotificationViews.NotificationCard, Row: NotificationViews.NotificationRow, Details: NotificationViews.NotificationDetails, Workflow: NotificationViews.NotificationWorkflow, sections: NotificationViews.NOTIFICATION_VIEW_SECTIONS }),
  vendorFeedback: Object.freeze({ Summary: VendorFeedbackViews.VendorFeedbackSummary, Card: VendorFeedbackViews.VendorFeedbackCard, Row: VendorFeedbackViews.VendorFeedbackRow, Details: VendorFeedbackViews.VendorFeedbackDetails, Workflow: VendorFeedbackViews.VendorFeedbackWorkflow, sections: VendorFeedbackViews.VENDORFEEDBACK_VIEW_SECTIONS }),
  deliveryZone: Object.freeze({ Summary: DeliveryZoneViews.DeliveryZoneSummary, Card: DeliveryZoneViews.DeliveryZoneCard, Row: DeliveryZoneViews.DeliveryZoneRow, Details: DeliveryZoneViews.DeliveryZoneDetails, Workflow: DeliveryZoneViews.DeliveryZoneWorkflow, sections: DeliveryZoneViews.DELIVERYZONE_VIEW_SECTIONS }),
  vendorDeliveryPricing: Object.freeze({ Summary: VendorDeliveryPricingViews.VendorDeliveryPricingSummary, Card: VendorDeliveryPricingViews.VendorDeliveryPricingCard, Row: VendorDeliveryPricingViews.VendorDeliveryPricingRow, Details: VendorDeliveryPricingViews.VendorDeliveryPricingDetails, Workflow: VendorDeliveryPricingViews.VendorDeliveryPricingWorkflow, sections: VendorDeliveryPricingViews.VENDORDELIVERYPRICING_VIEW_SECTIONS }),
  reminder: Object.freeze({ Summary: ReminderViews.ReminderSummary, Card: ReminderViews.ReminderCard, Row: ReminderViews.ReminderRow, Details: ReminderViews.ReminderDetails, Workflow: ReminderViews.ReminderWorkflow, sections: ReminderViews.REMINDER_VIEW_SECTIONS }),
  vendorActivity: Object.freeze({ Summary: VendorActivityViews.VendorActivitySummary, Card: VendorActivityViews.VendorActivityCard, Row: VendorActivityViews.VendorActivityRow, Details: VendorActivityViews.VendorActivityDetails, Workflow: VendorActivityViews.VendorActivityWorkflow, sections: VendorActivityViews.VENDORACTIVITY_VIEW_SECTIONS }),
  userReviewRestriction: Object.freeze({ Summary: UserReviewRestrictionViews.UserReviewRestrictionSummary, Card: UserReviewRestrictionViews.UserReviewRestrictionCard, Row: UserReviewRestrictionViews.UserReviewRestrictionRow, Details: UserReviewRestrictionViews.UserReviewRestrictionDetails, Workflow: UserReviewRestrictionViews.UserReviewRestrictionWorkflow, sections: UserReviewRestrictionViews.USERREVIEWRESTRICTION_VIEW_SECTIONS }),
  favorite: Object.freeze({ Summary: FavoriteViews.FavoriteSummary, Card: FavoriteViews.FavoriteCard, Row: FavoriteViews.FavoriteRow, Details: FavoriteViews.FavoriteDetails, Workflow: FavoriteViews.FavoriteWorkflow, sections: FavoriteViews.FAVORITE_VIEW_SECTIONS }),
});

export const SEMANTIC_ENTITY_TYPES = Object.freeze(Object.keys(SEMANTIC_VIEW_REGISTRY));

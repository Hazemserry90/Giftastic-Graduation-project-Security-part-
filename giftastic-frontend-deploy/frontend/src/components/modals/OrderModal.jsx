import OrderHeaderSection from '../../ui/entities/order/sections/OrderHeaderSection';
import OrderItemsSection from '../../ui/entities/order/sections/OrderItemsSection';
import OrderSummarySection from '../../ui/entities/order/sections/OrderSummarySection';
import OrderShippingSection from '../../ui/entities/order/sections/OrderShippingSection';
import OrderPaymentSection from '../../ui/entities/order/sections/OrderPaymentSection';
import OrderCustomerSection from '../../ui/entities/order/sections/OrderCustomerSection';
import OrderStatusControlsSection from '../../ui/entities/order/sections/OrderStatusControlsSection';
import OrderCustomerActionsSection from '../../ui/entities/order/sections/OrderCustomerActionsSection';
import OrderCommissionSection from '../../ui/entities/order/sections/OrderCommissionSection';
import OrderAssistanceSection from '../../ui/entities/order/sections/OrderAssistanceSection';
import OrderSystemSection from '../../ui/entities/order/sections/OrderSystemSection';
import OrderVendorProgressSection from '../../ui/entities/order/sections/OrderVendorProgressSection';
import EntityDialog from './EntityDialog';
import { getOrderVisibleTotal, getShortOrderId } from '../../ui/entities/order';

export default function OrderModal({
  entity,
  access,
  isOpen = true,
  onClose,
  title,
  getStatusOptions,
  onStatusChange,
  statusLoading = false,
  onCancel,
  cancelLoading = false,
  customerEntity,
  customerAccess,
  onCustomerOpen,
  assistanceRequests = [],
  assistanceActionsById = new Map(),
  assistanceMessagesById = new Map(),
  assistanceLoading = false,
  assistanceMessage = '',
  onAssistanceMessageChange,
  onRequestAssistance,
  assistanceSubmitting = false,
  assistanceReplies = {},
  onAssistanceReplyChange,
  assistanceReplyLoading = false,
  deliveryWorkflow,
  paymentWorkflow,
  vendorInvalidationDrafts,
  onVendorInvalidationDraftChange,
  onInvalidateVendorPortion,
  vendorInvalidationLoading = false,
}) {
  if (!isOpen || !entity || !access?.canRead) return null;

  const content = (
    <div className="grid gap-4">
      {access.sections.header && <OrderHeaderSection order={entity} />}
      {access.sections.items && <OrderItemsSection items={access.visibleItems || []} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {access.sections.customer && (
          <OrderCustomerSection
            order={entity}
            customerEntity={customerEntity}
            customerAccess={customerAccess}
            onCustomerOpen={onCustomerOpen}
          />
        )}
        {access.sections.shipping && <OrderShippingSection order={entity} />}
        {access.sections.payment && <OrderPaymentSection order={entity} access={access} />}
        {access.sections.summary && <OrderSummarySection order={entity} totalAmount={getOrderVisibleTotal(entity, access)} />}
        {access.sections.statusControls && (
          <OrderStatusControlsSection
            order={entity}
            getStatusOptions={getStatusOptions}
            onStatusChange={onStatusChange}
            loading={statusLoading}
          />
        )}
        {access.sections.customerActions && <OrderCustomerActionsSection order={entity} onCancel={onCancel} loading={cancelLoading} />}
      </div>
      {access.sections.commission && <OrderCommissionSection order={entity} />}
      {access.sections.vendorProgress && (
        <OrderVendorProgressSection
          order={entity}
          access={access}
          invalidationDrafts={vendorInvalidationDrafts}
          onInvalidationDraftChange={onVendorInvalidationDraftChange}
          onInvalidateVendorPortion={onInvalidateVendorPortion}
          invalidationLoading={vendorInvalidationLoading}
        />
      )}
      {paymentWorkflow}
      {access.sections.statusControls && deliveryWorkflow}
      {access.sections.assistance && (
        <OrderAssistanceSection
          requests={assistanceRequests}
          actionsById={assistanceActionsById}
          messagesById={assistanceMessagesById}
          loading={assistanceLoading}
          newMessage={assistanceMessage}
          onNewMessageChange={onAssistanceMessageChange}
          onRequestAssistance={onRequestAssistance}
          submitting={assistanceSubmitting}
          replies={assistanceReplies}
          onReplyChange={onAssistanceReplyChange}
          replyLoading={assistanceReplyLoading}
        />
      )}
      {access.sections.system && <OrderSystemSection order={entity} />}
    </div>
  );

  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title={title || `Order #${getShortOrderId(entity)}`} eyebrow="Order">
      {content}
    </EntityDialog>
  );
}

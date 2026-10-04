import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import { getOrderVisibleTotal } from '../orderSelectors';

export const ORDER_VIEW_SECTIONS = [
  {
    "title": "Order",
    "fields": [
      {
        "path": "id"
      },
      {
        "path": "status"
      },
      {
        "path": "placedAt",
        "label": "Placed",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Customer",
    "fields": [
      {
        "path": "customerName"
      },
      {
        "path": "customerEmail"
      },
      {
        "path": "customerId"
      },
      {
        "path": "guestInfo.email",
        "label": "Guest email"
      }
    ]
  },
  {
    "title": "Items",
    "fields": [
      {
        "path": "items",
        "label": "Items",
        "select": (_entity, access, value) => access?.visibleItems || value,
        "items": [
          {
            "path": "productName"
          },
          {
            "path": "quantity"
          },
          {
            "path": "price",
            "label": "Price",
            "format": "money"
          },
          {
            "path": "supplierId",
            "label": "Supplier ID"
          }
        ]
      }
    ]
  },
  {
    "title": "Totals",
    "fields": [
      {
        "path": "totalAmount",
        "label": "Total",
        "format": "money",
        "select": (entity, access) => getOrderVisibleTotal(entity, access)
      },
      {
        "path": "deliveryCost",
        "label": "Delivery",
        "format": "money"
      }
    ]
  },
  {
    "title": "Shipping",
    "fields": [
      {
        "path": "shippingAddress"
      },
      {
        "path": "deliveryZoneId"
      },
      {
        "path": "estimatedDeliveryDate",
        "label": "Estimated delivery",
        "format": "datetime"
      },
      {
        "path": "actualDeliveryDate",
        "label": "Delivered",
        "format": "datetime"
      },
      {
        "path": "deliveryNotes"
      }
    ]
  },
  {
    "title": "Payment",
    "fields": [
      {
        "path": "paymentMethod"
      },
      {
        "path": "instapayPhoneNumber"
      }
    ]
  },
  {
    "title": "Commission",
    "fields": [
      {
        "path": "commissionPaid",
        "label": "Commission paid",
        "format": "boolean"
      },
      {
        "path": "commissionPaidAt",
        "label": "Paid at",
        "format": "datetime"
      }
    ]
  }
];

export function OrderSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="id" subtitlePath="status" />;
}

export function OrderCard(props) { return <div className="h-full"><OrderSummary {...props} /></div>; }
export function OrderRow(props) { return <div role="row"><OrderSummary {...props} /></div>; }

export function OrderDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={ORDER_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function OrderWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <OrderDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

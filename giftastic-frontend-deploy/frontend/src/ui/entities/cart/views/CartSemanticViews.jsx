import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const CART_VIEW_SECTIONS = [
  {
    "title": "Items",
    "fields": [
      {
        "path": "items",
        "label": "Cart items",
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
            "path": "storeName",
            "label": "Vendor"
          }
        ]
      }
    ]
  },
  {
    "title": "Total",
    "fields": [
      {
        "path": "total",
        "label": "Total",
        "format": "money"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "id"
      },
      {
        "path": "customerId"
      },
      {
        "path": "updatedAt",
        "label": "Updated",
        "format": "datetime"
      }
    ]
  }
];

export function CartSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="id" subtitlePath="customerId" />;
}

export function CartCard(props) { return <div className="h-full"><CartSummary {...props} /></div>; }
export function CartRow(props) { return <div role="row"><CartSummary {...props} /></div>; }

export function CartDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={CART_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function CartWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <CartDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

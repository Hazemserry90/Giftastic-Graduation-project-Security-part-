import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const VENDORDELIVERYPRICING_VIEW_SECTIONS = [
  {
    "title": "Pricing",
    "fields": [
      {
        "path": "zoneName"
      },
      {
        "path": "deliveryCost",
        "label": "Delivery cost",
        "format": "money"
      },
      {
        "path": "updatedAt",
        "label": "Updated",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Identity",
    "fields": [
      {
        "path": "vendorId"
      },
      {
        "path": "zoneId"
      }
    ]
  }
];

export function VendorDeliveryPricingSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="zoneName" subtitlePath="deliveryCost" />;
}

export function VendorDeliveryPricingCard(props) { return <div className="h-full"><VendorDeliveryPricingSummary {...props} /></div>; }
export function VendorDeliveryPricingRow(props) { return <div role="row"><VendorDeliveryPricingSummary {...props} /></div>; }

export function VendorDeliveryPricingDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={VENDORDELIVERYPRICING_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function VendorDeliveryPricingWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <VendorDeliveryPricingDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const VENDORAPPLICATION_VIEW_SECTIONS = [
  {
    "title": "Storefront",
    "fields": [
      {
        "path": "storeName"
      },
      {
        "path": "description"
      },
      {
        "path": "logoUrl",
        "label": "Logo",
        "format": "url"
      },
      {
        "path": "bannerUrl",
        "label": "Banner",
        "format": "url"
      }
    ]
  },
  {
    "title": "Contact",
    "fields": [
      {
        "path": "contactEmail"
      },
      {
        "path": "contactPhone"
      },
      {
        "path": "address"
      },
      {
        "path": "websiteUrl",
        "label": "Website",
        "format": "url"
      },
      {
        "path": "workingHours"
      }
    ]
  },
  {
    "title": "Timeline",
    "fields": [
      {
        "path": "status"
      },
      {
        "path": "submittedAt",
        "label": "Submitted",
        "format": "datetime"
      },
      {
        "path": "reviewedAt",
        "label": "Reviewed",
        "format": "datetime"
      },
      {
        "path": "rejectionReason"
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
        "path": "userId"
      },
      {
        "path": "reviewedBy"
      }
    ]
  }
];

export function VendorApplicationSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="storeName" subtitlePath="status" />;
}

export function VendorApplicationCard(props) { return <div className="h-full"><VendorApplicationSummary {...props} /></div>; }
export function VendorApplicationRow(props) { return <div role="row"><VendorApplicationSummary {...props} /></div>; }

export function VendorApplicationDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={VENDORAPPLICATION_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function VendorApplicationWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <VendorApplicationDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

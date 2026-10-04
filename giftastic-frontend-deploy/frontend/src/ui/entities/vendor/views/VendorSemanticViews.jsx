import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const VENDOR_VIEW_SECTIONS = [
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
        "path": "workingHours"
      }
    ]
  },
  {
    "title": "Social",
    "fields": [
      {
        "path": "websiteUrl",
        "label": "Website",
        "format": "url"
      },
      {
        "path": "instagramUrl",
        "label": "Instagram",
        "format": "url"
      },
      {
        "path": "facebookUrl",
        "label": "Facebook",
        "format": "url"
      }
    ]
  },
  {
    "title": "Status",
    "fields": [
      {
        "path": "isVerified",
        "label": "Verified",
        "format": "boolean",
        "accessKey": "isVerified"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "supplierId",
        "label": "Supplier ID",
        "accessKey": "supplierId"
      },
      {
        "path": "userId",
        "label": "Owner ID",
        "accessKey": "userId"
      }
    ]
  }
];

export function VendorSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="storeName" subtitlePath="description" />;
}

export function VendorCard(props) { return <div className="h-full"><VendorSummary {...props} /></div>; }
export function VendorRow(props) { return <div role="row"><VendorSummary {...props} /></div>; }
export function VendorReference(props) { return <VendorSummary {...props} />; }

export function VendorDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={VENDOR_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function VendorWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <VendorDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

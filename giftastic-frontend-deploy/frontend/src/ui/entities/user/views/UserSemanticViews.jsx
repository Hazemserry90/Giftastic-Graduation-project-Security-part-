import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const USER_VIEW_SECTIONS = [
  {
    "title": "Identity",
    "fields": [
      {
        "path": "fullName"
      },
    ]
  },
  {
    "title": "Contact",
    "fields": [
      {
        "path": "email",
        "label": "Email",
        "accessKey": "email"
      },
      {
        "path": "phoneNumber",
        "label": "Phone",
        "accessKey": "phoneNumber"
      },
      {
        "path": "birthday",
        "label": "Birthday",
        "format": "date",
        "accessKey": "birthday"
      }
    ]
  },
  {
    "title": "Addresses",
    "fields": [
      {
        "path": "addresses",
        "label": "Addresses",
        "accessKey": "addresses",
        "items": [
          {
            "path": "label"
          },
          {
            "path": "street"
          },
          {
            "path": "city"
          },
          {
            "path": "country"
          },
          {
            "path": "isDefault",
            "label": "Default",
            "format": "boolean"
          }
        ]
      }
    ]
  },
  {
    "title": "Account",
    "fields": [
      {
        "path": "isBanned",
        "label": "Banned",
        "format": "boolean",
        "accessKey": "isBanned"
      },
      {
        "path": "requestedAdmin",
        "label": "Admin requested",
        "format": "boolean",
        "accessKey": "requestedAdmin"
      }
    ]
  },
  {
    "title": "Vendor facet",
    "fields": [
      {
        "path": "facets.vendor.isVendor",
        "label": "Vendor",
        "format": "boolean",
        "accessKey": "vendorBadge"
      },
      {
        "path": "facets.vendor.supplierId",
        "label": "Supplier ID",
        "accessKey": "supplierId"
      }
    ]
  },
  {
    "title": "Admin facet",
    "fields": [
      {
        "path": "facets.admin.isAdmin",
        "label": "Admin",
        "format": "boolean",
        "accessKey": "adminBadge"
      },
      {
        "path": "facets.admin.isSuperAdmin",
        "label": "Super Admin",
        "format": "boolean",
        "accessKey": "superAdminBadge"
      },
      {
        "path": "facets.admin.permissions",
        "label": "Permissions",
        "format": "count",
        "accessKey": "adminPermissions"
      }
    ]
  },
  {
    "title": "Review restriction",
    "fields": [
      {
        "path": "facets.reviewRestriction.isActive",
        "label": "Restricted",
        "format": "boolean",
        "accessKey": "reviewRestriction"
      },
      {
        "path": "facets.reviewRestriction.reason",
        "label": "Reason",
        "accessKey": "reviewRestriction"
      }
    ]
  }
];

export function UserSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="fullName" />;
}

export function UserCard(props) { return <div className="h-full"><UserSummary {...props} /></div>; }
export function UserRow(props) { return <div role="row"><UserSummary {...props} /></div>; }

export function UserDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={USER_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function UserWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <UserDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

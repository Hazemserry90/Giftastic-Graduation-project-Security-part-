import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const PRODUCT_VIEW_SECTIONS = [
  {
    "title": "Commerce",
    "fields": [
      {
        "path": "name"
      },
      {
        "path": "description"
      },
      {
        "path": "currentPrice",
        "label": "Price",
        "format": "money"
      },
      {
        "path": "price",
        "label": "Original price",
        "format": "money"
      },
      {
        "path": "averageRating",
        "label": "Rating",
        "format": "rating"
      },
      {
        "path": "reviewCount"
      }
    ]
  },
  {
    "title": "Media and taxonomy",
    "fields": [
      {
        "path": "images",
        "label": "Images",
        "format": "count"
      },
      {
        "path": "categories",
        "label": "Categories",
        "format": "count"
      }
    ]
  },
  {
    "title": "Inventory",
    "fields": [
      {
        "path": "stockQuantity",
        "accessKey": "stockQuantity"
      },
      {
        "path": "status",
        "accessKey": "status"
      }
    ]
  },
  {
    "title": "Review request",
    "fields": [
      {
        "path": "reviewRequestStatus",
        "label": "Request status",
        "accessKey": "status"
      },
      {
        "path": "reviewRequestedFromStatus",
        "label": "Requested from",
        "accessKey": "status"
      },
      {
        "path": "reviewRequestedAt",
        "label": "Request date",
        "format": "datetime",
        "accessKey": "status"
      },
      {
        "path": "reviewRequestMessage",
        "label": "Vendor message",
        "accessKey": "vendorDetails"
      },
      {
        "path": "reviewRejectionReason",
        "label": "Rejection reason",
        "accessKey": "vendorDetails"
      }
    ]
  },
  {
    "title": "Personalization",
    "fields": [
      {
        "path": "details.allowsEngraving",
        "label": "Engraving",
        "format": "boolean",
        "accessKey": "vendorDetails"
      },
      {
        "path": "details.allowsCustomMessage",
        "label": "Custom message",
        "format": "boolean",
        "accessKey": "vendorDetails"
      },
      {
        "path": "details.allowsPhotoUpload",
        "label": "Photo upload",
        "format": "boolean",
        "accessKey": "vendorDetails"
      },
      {
        "path": "details.availableColors"
      },
      {
        "path": "details.availableSizes"
      }
    ]
  },
  {
    "title": "Delivery",
    "fields": [
      {
        "path": "details.requiresDeliveryDate",
        "label": "Delivery date required",
        "format": "boolean"
      },
      {
        "path": "details.minDeliveryDays"
      },
      {
        "path": "details.maxDeliveryDays"
      },
      {
        "path": "details.isPerishable",
        "label": "Perishable",
        "format": "boolean"
      }
    ]
  },
  {
    "title": "Vendor data",
    "fields": [
      {
        "path": "details.vendorSku",
        "label": "Vendor SKU",
        "accessKey": "vendorDetails"
      },
      {
        "path": "details.vendorNotes",
        "label": "Vendor notes",
        "accessKey": "vendorDetails"
      },
      {
        "path": "stockQuantity",
        "accessKey": "stockQuantity"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "id",
        "label": "Product ID",
        "accessKey": "id"
      },
      {
        "path": "supplierId",
        "label": "Supplier ID",
        "accessKey": "supplierId"
      },
      {
        "path": "createdAt",
        "label": "Created",
        "format": "datetime",
        "accessKey": "id"
      },
      {
        "path": "updatedAt",
        "label": "Updated",
        "format": "datetime",
        "accessKey": "id"
      }
    ]
  }
];

export function ProductSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="name" subtitlePath="description" />;
}

export function ProductCard(props) { return <div className="h-full"><ProductSummary {...props} /></div>; }
export function ProductRow(props) { return <div role="row"><ProductSummary {...props} /></div>; }
export function ProductReference(props) { return <ProductSummary {...props} />; }

export function ProductDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={PRODUCT_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function ProductWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <ProductDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

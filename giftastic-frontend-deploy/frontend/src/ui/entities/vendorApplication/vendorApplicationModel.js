import { createEntityModel } from '../shared/entityModel.js';

export const VENDOR_APPLICATION_ENTITY_TYPE = 'vendorApplication';
export const createVendorApplicationModel = ({ source } = {}) => createEntityModel(
  VENDOR_APPLICATION_ENTITY_TYPE,
  [
    'id', 'userId', 'storeName', 'description', 'logoUrl', 'bannerUrl',
    'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl',
    'facebookUrl', 'workingHours', 'status', 'submittedAt', 'reviewedAt',
    'reviewedBy', 'rejectionReason',
  ],
  source,
);

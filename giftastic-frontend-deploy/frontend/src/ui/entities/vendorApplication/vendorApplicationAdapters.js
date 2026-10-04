import { adaptEntity } from '../shared/entityModel.js';
import { createVendorApplicationModel } from './vendorApplicationModel.js';

const FIELDS = [
  'id', 'userId', 'storeName', 'description', 'logoUrl', 'bannerUrl',
  'contactEmail', 'contactPhone', 'address', 'websiteUrl', 'instagramUrl',
  'facebookUrl', 'workingHours', 'status', 'submittedAt', 'reviewedAt',
  'reviewedBy', 'rejectionReason',
];

export function adaptVendorApplication(input = {}, { source = 'vendor-application', complete = false } = {}) {
  if (
    input?.entityType === 'vendorApplication'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(
    input,
    createVendorApplicationModel({ source }),
    Object.fromEntries(FIELDS.map((field) => [field, [field]])),
  );
  model.meta.isPartial = !complete;
  return model;
}

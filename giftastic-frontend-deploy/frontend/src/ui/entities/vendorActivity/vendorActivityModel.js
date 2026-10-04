import { createEntityModel } from '../shared/entityModel.js';

export const VENDOR_ACTIVITY_ENTITY_TYPE = 'vendorActivity';
export const createVendorActivityModel = ({ source } = {}) => ({
  ...createEntityModel(VENDOR_ACTIVITY_ENTITY_TYPE, [
    'id', 'vendorId', 'activityType', 'description', 'relatedEntityId', 'metadata', 'occurredAt',
  ], source),
  parsedMetadata: null,
  relatedEntity: null,
});

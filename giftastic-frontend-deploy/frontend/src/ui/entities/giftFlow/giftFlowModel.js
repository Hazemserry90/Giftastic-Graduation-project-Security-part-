import { createEntityModel } from '../shared/entityModel.js';

export const GIFT_FLOW_ENTITY_TYPE = 'giftFlow';
export const createGiftFlowModel = ({ source } = {}) => ({
  ...createEntityModel(GIFT_FLOW_ENTITY_TYPE, [
    'id', 'supplierId', 'name', 'description', 'configuration', 'imageUrl',
    'createdAt', 'updatedAt',
  ], source),
  parsedConfiguration: { steps: [] },
  productIds: [],
});

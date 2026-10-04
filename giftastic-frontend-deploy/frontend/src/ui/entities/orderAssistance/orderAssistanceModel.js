import { createEntityModel } from '../shared/entityModel.js';

export const ORDER_ASSISTANCE_ENTITY_TYPE = 'orderAssistance';
export const createOrderAssistanceModel = ({ source } = {}) => ({
  ...createEntityModel(ORDER_ASSISTANCE_ENTITY_TYPE, [
    'id', 'orderId', 'supplierId', 'supplierName', 'message', 'status',
    'requestedAt', 'resolvedAt', 'resolvedBy', 'resolution', 'messages',
  ], source),
  messages: [],
});

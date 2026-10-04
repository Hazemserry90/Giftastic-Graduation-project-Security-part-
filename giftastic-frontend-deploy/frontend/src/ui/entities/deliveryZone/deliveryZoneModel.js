import { createEntityModel } from '../shared/entityModel.js';

export const DELIVERY_ZONE_ENTITY_TYPE = 'deliveryZone';
export const createDeliveryZoneModel = ({ source } = {}) =>
  createEntityModel(DELIVERY_ZONE_ENTITY_TYPE, ['id', 'zoneName', 'description', 'isActive'], source);

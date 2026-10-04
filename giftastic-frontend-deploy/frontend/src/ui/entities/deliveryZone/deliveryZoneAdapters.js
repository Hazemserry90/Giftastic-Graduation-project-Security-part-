import { adaptEntity } from '../shared/entityModel.js';
import { createDeliveryZoneModel } from './deliveryZoneModel.js';

export function adaptDeliveryZone(input = {}, { source = 'delivery-zone', complete = false } = {}) {
  if (
    input?.entityType === 'deliveryZone'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createDeliveryZoneModel({ source }), {
    id: ['id', 'zoneId'], zoneName: ['zoneName', 'name'],
    description: ['description'], isActive: ['isActive', 'active'],
  });
  model.meta.isPartial = !complete;
  return model;
}

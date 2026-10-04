import { adaptEntity, createEntityReference, markDerivedFieldInvalid, safeParseJson, setDerivedEntityValue } from '../shared/entityModel.js';
import { createVendorActivityModel } from './vendorActivityModel.js';

export function adaptVendorActivity(input = {}, { source = 'vendor-activity', complete = false } = {}) {
  if (
    input?.entityType === 'vendorActivity'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createVendorActivityModel({ source }), {
    id: ['id'], vendorId: ['vendorId', 'supplierId'], activityType: ['activityType'],
    description: ['description'], relatedEntityId: ['relatedEntityId'],
    metadata: ['metadata'], occurredAt: ['occurredAt'],
  });
  if (model.meta.loadedFields.has('metadata')) {
    const result = safeParseJson(model.metadata);
    if (result.ok) setDerivedEntityValue(model, 'parsedMetadata', result.value);
    else markDerivedFieldInvalid(model, 'parsedMetadata', model.metadata, result.reason);
  }
  if (model.meta.loadedFields.has('relatedEntityId') || model.meta.loadedFields.has('activityType')) {
    const type = model.activityType?.startsWith('ORDER_') ? 'order'
      : model.activityType?.startsWith('PRODUCT_') ? 'product'
        : model.activityType?.startsWith('REVIEW_') ? 'review'
          : model.activityType?.startsWith('FEEDBACK_') ? 'vendorFeedback'
            : model.activityType?.startsWith('GIFT_FLOW_') ? 'giftFlow'
              : model.activityType === 'DELIVERY_PRICING_UPDATED' ? 'vendorDeliveryPricing'
                : null;
    setDerivedEntityValue(model, 'relatedEntity', type && model.relatedEntityId
      ? createEntityReference(type, model.relatedEntityId)
      : null);
  }
  model.meta.isPartial = !complete;
  return model;
}

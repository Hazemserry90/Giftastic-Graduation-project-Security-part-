import {
  adaptEntity,
  createEntityReference,
  markDerivedFieldInvalid,
  safeParseJson,
  setDerivedEntityValue,
} from '../shared/entityModel.js';
import { createNotificationModel } from './notificationModel.js';

export function parseNotificationMetadata(value) {
  return safeParseJson(value).value;
}

export function adaptNotification(input = {}, { source = 'notification', complete = false } = {}) {
  if (input?.entityType === 'notification' && input?.meta?.loadedFields instanceof Set) return input;
  const model = adaptEntity(input, createNotificationModel({ source }), {
    id: ['id', 'notificationId'],
    userId: ['userId'],
    title: ['title'],
    message: ['message'],
    type: ['type'],
    read: ['read', 'isRead'],
    createdAt: ['createdAt'],
    metadata: ['metadata'],
  });
  if (model.meta.loadedFields.has('metadata')) {
    const result = safeParseJson(model.metadata);
    const parsed = result.value;
    if (result.ok) setDerivedEntityValue(model, 'parsedMetadata', parsed);
    else markDerivedFieldInvalid(model, 'parsedMetadata', model.metadata, result.reason);
    const type = parsed?.entityType || parsed?.type || null;
    const id = parsed?.entityId || parsed?.orderId || parsed?.productId || parsed?.supplierId || null;
    setDerivedEntityValue(model, 'relatedEntity', type || id
      ? createEntityReference(type, id)
      : null);
  }
  model.meta.isPartial = !complete;
  return model;
}

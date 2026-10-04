import { createEntityModel } from '../shared/entityModel.js';

export const NOTIFICATION_ENTITY_TYPE = 'notification';
export const createNotificationModel = ({ source } = {}) => ({
  ...createEntityModel(NOTIFICATION_ENTITY_TYPE, [
    'id', 'userId', 'title', 'message', 'type', 'read', 'createdAt', 'metadata',
  ], source),
  parsedMetadata: null,
  relatedEntity: null,
});

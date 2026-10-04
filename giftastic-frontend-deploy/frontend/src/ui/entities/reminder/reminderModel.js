import { createEntityModel } from '../shared/entityModel.js';

export const REMINDER_ENTITY_TYPE = 'reminder';
export const createReminderModel = ({ source } = {}) =>
  createEntityModel(REMINDER_ENTITY_TYPE, ['id', 'customerId', 'description', 'scheduledAt', 'processed'], source);

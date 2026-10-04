import { adaptEntity } from '../shared/entityModel.js';
import { createReminderModel } from './reminderModel.js';

export function adaptReminder(input = {}, { source = 'reminder', complete = false } = {}) {
  if (
    input?.entityType === 'reminder'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(input, createReminderModel({ source }), {
    id: ['id', 'reminderId'], customerId: ['customerId', 'userId'],
    description: ['description'], scheduledAt: ['scheduledAt'], processed: ['processed'],
  });
  model.meta.isPartial = !complete;
  return model;
}

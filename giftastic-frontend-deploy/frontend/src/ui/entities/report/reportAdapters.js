import { adaptEntity } from '../shared/entityModel.js';
import { createReportModel } from './reportModel.js';

export function adaptReport(input = {}, { source = 'report', complete = false } = {}) {
  if (
    input?.entityType === 'report'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const fields = ['id', 'reporterId', 'reportType', 'reportedEntityId', 'reason', 'description',
    'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'adminNotes', 'outcomeType', 'outcomeAction'];
  const model = adaptEntity(input, createReportModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])));
  model.meta.isPartial = !complete;
  return model;
}

import { adaptEntity } from '../shared/entityModel.js';
import { createAdminRequestModel } from './adminRequestModel.js';

const FIELDS = [
  'id', 'userId', 'userEmail', 'userFullName', 'message', 'status',
  'requestedAt', 'reviewedAt', 'reviewedBy', 'reviewNotes', 'canReapplyAt',
];

export function adaptAdminRequest(input = {}, { source = 'admin-request', complete = false } = {}) {
  if (
    input?.entityType === 'adminRequest'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const model = adaptEntity(
    input,
    createAdminRequestModel({ source }),
    Object.fromEntries(FIELDS.map((field) => [field, [field]])),
  );
  model.meta.isPartial = !complete;
  return model;
}

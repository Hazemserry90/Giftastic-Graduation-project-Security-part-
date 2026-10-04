import { createEntityModel } from '../shared/entityModel.js';

export const ADMIN_REQUEST_ENTITY_TYPE = 'adminRequest';
export const createAdminRequestModel = ({ source } = {}) => createEntityModel(
  ADMIN_REQUEST_ENTITY_TYPE,
  [
    'id', 'userId', 'userEmail', 'userFullName', 'message', 'status',
    'requestedAt', 'reviewedAt', 'reviewedBy', 'reviewNotes', 'canReapplyAt',
  ],
  source,
);

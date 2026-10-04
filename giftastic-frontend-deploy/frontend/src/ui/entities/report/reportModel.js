import { createEntityModel } from '../shared/entityModel.js';

export const REPORT_ENTITY_TYPE = 'report';
export const createReportModel = ({ source } = {}) => createEntityModel(REPORT_ENTITY_TYPE, [
  'id', 'reporterId', 'reportType', 'reportedEntityId', 'reason', 'description',
  'status', 'createdAt', 'reviewedAt', 'reviewedBy', 'adminNotes',
  'outcomeType', 'outcomeAction',
], source);

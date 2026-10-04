import { commandDraftToPayload } from '../index.js';
export const mapReportSubmissionPayload = (draft) => commandDraftToPayload('reportSubmission', draft);

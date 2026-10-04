import { commandDraftToPayload } from '../index.js';
export const mapReviewSubmissionPayload = (draft) => commandDraftToPayload('reviewSubmission', draft);

import { commandDraftToPayload } from '../index.js';
export const mapFeedbackSubmissionPayload = (draft) => commandDraftToPayload('feedbackSubmission', draft);

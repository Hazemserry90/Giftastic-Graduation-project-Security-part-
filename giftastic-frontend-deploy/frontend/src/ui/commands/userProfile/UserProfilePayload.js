import { commandDraftToPayload } from '../index.js';
export const mapUserProfilePayload = (draft) => commandDraftToPayload('userProfile', draft);

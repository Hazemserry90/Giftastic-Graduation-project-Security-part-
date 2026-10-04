import { commandDraftToPayload } from '../index.js';
export const mapReminderPayload = (draft) => commandDraftToPayload('reminder', draft);

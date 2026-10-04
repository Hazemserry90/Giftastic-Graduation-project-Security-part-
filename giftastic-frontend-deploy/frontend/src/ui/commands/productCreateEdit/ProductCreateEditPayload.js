import { commandDraftToPayload } from '../index.js';
export const mapProductCreateEditPayload = (draft) => commandDraftToPayload('productCreateEdit', draft);

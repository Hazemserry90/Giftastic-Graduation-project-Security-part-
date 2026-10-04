import { commandDraftToPayload } from '../index.js';
export const mapCheckoutPayload = (draft) => commandDraftToPayload('checkout', draft);

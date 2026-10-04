import { commandDraftToPayload } from '../index.js';
export const mapDeliveryDelayPayload = (draft) => commandDraftToPayload('deliveryDelay', draft);

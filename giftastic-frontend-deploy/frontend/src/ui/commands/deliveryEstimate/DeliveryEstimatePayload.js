import { commandDraftToPayload } from '../index.js';
export const mapDeliveryEstimatePayload = (draft) => commandDraftToPayload('deliveryEstimate', draft);

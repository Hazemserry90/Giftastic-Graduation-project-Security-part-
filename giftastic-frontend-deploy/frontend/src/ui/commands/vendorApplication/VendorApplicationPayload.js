import { commandDraftToPayload } from '../index.js';
export const mapVendorApplicationPayload = (draft) => commandDraftToPayload('vendorApplication', draft);

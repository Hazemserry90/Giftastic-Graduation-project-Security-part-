import { commandDraftToPayload } from '../index.js';
export const mapCommissionRulePayload = (draft) => commandDraftToPayload('commissionRule', draft);

import { commandDraftToPayload } from '../index.js';
export const mapProductDiscountPayload = (draft) => commandDraftToPayload('productDiscount', draft);

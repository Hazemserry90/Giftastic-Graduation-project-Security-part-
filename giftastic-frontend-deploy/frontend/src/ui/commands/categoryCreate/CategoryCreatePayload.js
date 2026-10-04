import { commandDraftToPayload } from '../index.js'; export const mapCategoryCreatePayload = (draft) => commandDraftToPayload('categoryCreate', draft);

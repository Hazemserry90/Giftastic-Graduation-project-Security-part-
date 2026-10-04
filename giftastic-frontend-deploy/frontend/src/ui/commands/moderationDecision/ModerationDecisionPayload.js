import { commandDraftToPayload } from '../index.js'; export const mapModerationDecisionPayload = (draft) => commandDraftToPayload('moderationDecision', draft);

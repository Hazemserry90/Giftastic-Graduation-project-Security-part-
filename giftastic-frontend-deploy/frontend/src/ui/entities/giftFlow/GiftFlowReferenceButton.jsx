import { getGiftFlowDisplayName } from './giftFlowSelectors.js';

export default function GiftFlowReferenceButton({ flow, access, onSelect }) {
  if (!flow || !access?.canRead) return null;
  return (
    <button type="button" onClick={() => onSelect(flow)} className="rounded-full bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20">
      {getGiftFlowDisplayName(flow)}
    </button>
  );
}

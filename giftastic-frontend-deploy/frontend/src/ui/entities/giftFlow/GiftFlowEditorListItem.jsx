import { getGiftFlowDisplayName, summarizeGiftFlow } from './giftFlowSelectors.js';

export default function GiftFlowEditorListItem({ flow, access, selected, onSelect }) {
  if (!flow || !access?.canRead) return null;
  const summary = summarizeGiftFlow(flow);
  return (
    <button type="button" onClick={() => onSelect(flow)} className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}>
      <p className="font-semibold">{getGiftFlowDisplayName(flow)}</p>
      <p className={`text-xs ${selected ? 'text-on-primary/80' : 'text-secondary'}`}>{summary.steps} steps</p>
    </button>
  );
}

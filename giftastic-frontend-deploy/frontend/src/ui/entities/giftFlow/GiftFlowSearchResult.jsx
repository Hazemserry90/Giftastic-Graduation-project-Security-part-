import { Link } from 'react-router-dom';
import { getGiftFlowDisplayName, getGiftFlowImage } from './giftFlowSelectors.js';

export default function GiftFlowSearchResult({ flow, access, to, onSelect }) {
  if (!flow || !access?.canRead) return null;
  return (
    <Link to={to} onClick={onSelect} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-stone-50">
      <img src={getGiftFlowImage(flow) || '/placeholder.png'} alt={getGiftFlowDisplayName(flow)} className="h-12 w-12 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{getGiftFlowDisplayName(flow)}</div>
        {flow.description && <div className="truncate text-xs text-gray-500">{flow.description}</div>}
      </div>
    </Link>
  );
}

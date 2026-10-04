import { getGiftFlowDisplayName } from './giftFlowSelectors.js';

export default function GiftFlowExecutionHeader({ flow, access, favoriteAction }) {
  if (!flow || !access?.canRead) return null;
  return (
    <header className="flex items-start justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md md:p-8">
      <div className="min-w-0 space-y-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">Custom Gift Box Creator</span>
        <h1 className="break-words [overflow-wrap:anywhere] text-3xl font-extrabold tracking-tight text-stone-900 md:text-4xl">{getGiftFlowDisplayName(flow)}</h1>
        <p className="break-words [overflow-wrap:anywhere] text-sm leading-relaxed text-stone-500 md:text-base">{flow.description || 'Follow the steps to configure and build your custom gift.'}</p>
      </div>
      {favoriteAction}
    </header>
  );
}

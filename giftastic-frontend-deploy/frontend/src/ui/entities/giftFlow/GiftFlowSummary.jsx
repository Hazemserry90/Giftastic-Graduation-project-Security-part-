import { Link } from 'react-router-dom';
import { getGiftFlowDisplayName, getGiftFlowImage, summarizeGiftFlow } from './giftFlowSelectors';

export default function GiftFlowSummary({ flow, access, to, onPreview, favoriteAction }) {
  if (!flow || !access?.canRead) return null;
  const image = getGiftFlowImage(flow);
  const summary = summarizeGiftFlow(flow);
  const content = (
    <>
      <div className="relative h-56 overflow-hidden bg-stone-100">
        {image ? (
          <img src={image} alt={getGiftFlowDisplayName(flow)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center text-on-surface-variant">Gift journey</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {favoriteAction && <div className="absolute right-4 top-4">{favoriteAction}</div>}
      </div>
      <div className="flex flex-grow flex-col p-6">
        <h2 className="break-words [overflow-wrap:anywhere] text-xl font-bold text-primary">{getGiftFlowDisplayName(flow)}</h2>
        {flow.description && <p className="mt-3 line-clamp-3 break-words [overflow-wrap:anywhere] text-sm text-secondary">{flow.description}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">
            {summary.steps} steps · {summary.productRefs} products
          </span>
          {onPreview && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onPreview(flow);
              }}
              className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="group flex flex-col overflow-hidden rounded-2xl border border-surface-container bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
      {content}
    </Link>
  ) : (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-surface-container bg-white">
      {content}
    </article>
  );
}

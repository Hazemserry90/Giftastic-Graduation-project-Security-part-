// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';
import {
  getGiftFlowDisplayName,
  getGiftFlowImage,
  summarizeGiftFlow,
} from '../giftFlowSelectors';

export default function GiftFlowHeroSection({ flow, config, action }) {
  const summary = summarizeGiftFlow({ parsedConfiguration: config });

  return (
    <GiftFlowSection title="Gift Flow" icon="auto_awesome" action={action}>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
          <img
            src={getGiftFlowImage(flow)}
          alt={getGiftFlowDisplayName(flow)}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              {summary.steps} step{summary.steps === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              {summary.productRefs} product option{summary.productRefs === 1 ? '' : 's'}
            </span>
            {summary.requiredSteps > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {summary.requiredSteps} required step{summary.requiredSteps === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <h3 className="break-words [overflow-wrap:anywhere] font-headline-md text-2xl font-bold text-primary">
            {getGiftFlowDisplayName(flow)}
          </h3>
          <p className="mt-4 whitespace-pre-line break-words [overflow-wrap:anywhere] text-sm leading-6 text-on-surface-variant">
            {flow?.description || 'Custom curated gift experience tailored for meaningful connections.'}
          </p>
        </div>
      </div>
    </GiftFlowSection>
  );
}

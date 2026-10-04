// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';

export default function GiftFlowStructureSection({ config }) {
  const steps = config?.steps || [];

  if (steps.length === 0) {
    return (
      <GiftFlowSection title="Structure" icon="schema">
        <p className="text-sm italic text-on-surface-variant">No configured steps were found.</p>
      </GiftFlowSection>
    );
  }

  return (
    <GiftFlowSection title="Structure" icon="schema">
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <article key={step.id || index} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                  Step {index + 1}
                </p>
                <h4 className="mt-1 break-words [overflow-wrap:anywhere] font-bold text-primary">{step.title}</h4>
                {step.description && (
                  <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm leading-6 text-on-surface-variant">{step.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-primary">
                  {step.type === 'multiple' ? 'Multiple choice' : 'Single choice'}
                </span>
                {step.required !== false && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    Required
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs font-semibold text-on-surface-variant">
              {(step.products || []).length} product option{(step.products || []).length === 1 ? '' : 's'}
            </div>
          </article>
        ))}
      </div>
    </GiftFlowSection>
  );
}

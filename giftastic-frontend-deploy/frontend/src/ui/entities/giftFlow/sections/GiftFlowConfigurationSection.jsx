// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';

export default function GiftFlowConfigurationSection({ config }) {
  const steps = config?.steps || [];
  const productOptions = steps.reduce((total, step) => total + (step.products || []).length, 0);
  const requiredSteps = steps.filter((step) => step.required !== false).length;

  return (
    <GiftFlowSection title="Configuration" icon="tune">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-secondary">Customization steps</dt>
          <dd className="mt-1 text-lg font-bold text-primary">{steps.length}</dd>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-secondary">Product options</dt>
          <dd className="mt-1 text-lg font-bold text-primary">{productOptions}</dd>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-secondary">Selection rules</dt>
          <dd className="mt-2 text-sm text-on-surface-variant">
            {steps.length === 0
              ? 'No customization rules have been configured.'
              : `${requiredSteps} required and ${steps.length - requiredSteps} optional steps.`}
          </dd>
        </div>
      </dl>
    </GiftFlowSection>
  );
}

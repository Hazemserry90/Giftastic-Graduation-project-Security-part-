// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-all rounded-lg bg-stone-50 p-2 font-mono text-xs text-primary">{String(value)}</dd>
    </div>
  );
}

export default function GiftFlowVendorSection({ flow }) {
  if (!flow?.supplierId) return null;

  return (
    <GiftFlowSection title="Vendor Data" icon="storefront">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier ID" value={flow.supplierId} />
      </dl>
    </GiftFlowSection>
  );
}

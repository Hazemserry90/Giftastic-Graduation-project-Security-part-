import VendorSection from './VendorSection';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</div>
      <div className="break-all rounded-lg bg-stone-50 p-3 font-mono text-xs text-on-surface">{value}</div>
    </div>
  );
}

export default function VendorSystemSection({ model, access }) {
  if (!access.sections.system) return null;
  return (
    <VendorSection title="System" icon="database">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier ID" value={model.supplierId} />
        <Field label="User ID" value={model.userId} />
      </div>
    </VendorSection>
  );
}

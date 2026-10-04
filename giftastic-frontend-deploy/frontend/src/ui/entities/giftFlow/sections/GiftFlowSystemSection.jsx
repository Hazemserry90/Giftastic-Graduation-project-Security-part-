// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';
import { formatGiftFlowDate, getGiftFlowId } from '../giftFlowSelectors';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-all rounded-lg bg-stone-50 p-2 font-mono text-xs text-primary">{String(value)}</dd>
    </div>
  );
}

export default function GiftFlowSystemSection({ flow }) {
  return (
    <GiftFlowSection title="System" icon="database">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Flow ID" value={getGiftFlowId(flow)} />
        <Field label="Supplier ID" value={flow?.supplierId} />
        <Field label="Created at" value={formatGiftFlowDate(flow?.createdAt)} />
        <Field label="Updated at" value={formatGiftFlowDate(flow?.updatedAt)} />
      </dl>
    </GiftFlowSection>
  );
}

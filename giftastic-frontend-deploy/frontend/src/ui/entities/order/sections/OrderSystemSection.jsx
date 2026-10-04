// Canonical Order presentation section.
import OrderSection from './OrderSection';

function SystemField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</div>
      <div className="break-all rounded-lg bg-stone-50 p-3 font-mono text-xs text-on-surface">{value}</div>
    </div>
  );
}

export default function OrderSystemSection({ order }) {
  return (
    <OrderSection title="System" icon="database">
      <div className="grid gap-4 sm:grid-cols-2">
        <SystemField label="Order ID" value={order?.id} />
        <SystemField label="Customer ID" value={order?.customerId} />
        <SystemField label="Vendor ID" value={order?.vendorId || order?.supplierId} />
      </div>
    </OrderSection>
  );
}


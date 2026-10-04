// Canonical Order presentation section.
import OrderSection from './OrderSection';

export default function OrderStatusControlsSection({ order, getStatusOptions, onStatusChange, loading = false }) {
  if (!onStatusChange) return null;

  const options = getStatusOptions ? getStatusOptions(order?.status) : [order?.status].filter(Boolean);

  return (
    <OrderSection title="Status Controls" icon="published_with_changes">
      <select
        value={order?.status || ''}
        onChange={(event) => onStatusChange(order.id, event.target.value)}
        disabled={loading || options.length <= 1}
        className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold uppercase text-primary outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      >
        {options.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </OrderSection>
  );
}


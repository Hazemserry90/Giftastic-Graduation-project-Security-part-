// Canonical Order presentation section.
import OrderSection from './OrderSection';

export default function OrderCustomerActionsSection({ order, onCancel, loading = false }) {
  if (!onCancel) return null;

  return (
    <OrderSection title="Customer Actions" icon="support_agent">
      <button
        type="button"
        onClick={() => onCancel(order)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">cancel</span>
        Cancel Order
      </button>
    </OrderSection>
  );
}


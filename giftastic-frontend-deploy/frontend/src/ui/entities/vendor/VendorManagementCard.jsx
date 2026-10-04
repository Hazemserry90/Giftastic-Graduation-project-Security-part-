import VendorSummary from './VendorSummary';

export default function VendorManagementCard({
  vendor,
  access,
  actions = [],
  loading = false,
  onDetails,
}) {
  return (
    <article className="flex min-w-0 max-w-full flex-col items-stretch gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
      <div className="min-w-0 max-w-full flex-1 overflow-hidden">
        <VendorSummary model={vendor} access={access} />
      </div>
      <div className="flex flex-wrap gap-2 lg:shrink-0">
        <button type="button" onClick={() => onDetails?.(vendor)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-sky-600">
          Details
        </button>
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onSelect}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${action.intent === 'danger' || action.key === 'deactivate' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}

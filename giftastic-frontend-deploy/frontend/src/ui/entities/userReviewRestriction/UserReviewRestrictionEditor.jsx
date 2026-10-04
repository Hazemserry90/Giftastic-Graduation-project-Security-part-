export default function UserReviewRestrictionEditor({ draft, access, actions = [], onChange, loading = false, saveDisabled = false }) {
  if (!access?.canManage) return null;
  return (
    <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="mb-4 font-bold text-primary">Review restrictions</h3>
      <div className="grid gap-3">
        <textarea aria-label="Restriction reason" value={draft.reason} onChange={(event) => onChange({ ...draft, reason: event.target.value })} placeholder="Restriction reason" className="rounded-lg border border-stone-300 p-3" />
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button key={action.key} type="button" onClick={action.onSelect} disabled={loading || (action.key === 'save' && saveDisabled)} className={`rounded-lg px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50 ${action.tone === 'danger' ? 'border border-error text-error' : 'bg-primary text-white'}`}>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

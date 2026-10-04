import VendorSection from './VendorSection';

const tones = {
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export default function VendorActionsSection({ model, actions, onAction, loading }) {
  if (!onAction || actions.length === 0) return null;
  return (
    <VendorSection title="Vendor Actions" icon="admin_panel_settings">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button key={action.key} type="button" onClick={() => onAction(action.key, model)} disabled={loading} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] disabled:opacity-50 ${tones[action.tone]}`}>
            <span className="material-symbols-outlined text-[18px]">{action.icon}</span>{action.label}
          </button>
        ))}
      </div>
    </VendorSection>
  );
}

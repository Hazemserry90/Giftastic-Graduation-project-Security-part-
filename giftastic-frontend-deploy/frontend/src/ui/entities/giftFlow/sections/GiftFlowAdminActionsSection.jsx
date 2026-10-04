// Canonical Gift Flow presentation section.
import GiftFlowSection from './GiftFlowSection';

export default function GiftFlowAdminActionsSection({ actions = [], loading }) {
  if (actions.length === 0) return null;

  return (
    <GiftFlowSection title="Actions" icon="admin_panel_settings">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={loading}
            onClick={action.onSelect}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
              action.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{action.key === 'delete' ? 'delete_forever' : 'edit'}</span>
            {action.label}
          </button>
        ))}
      </div>
    </GiftFlowSection>
  );
}

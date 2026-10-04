// Canonical Product presentation section.
import ProductSection from './ProductSection';

const ICONS = {
  approve: 'check_circle',
  reject: 'cancel',
  deactivate: 'visibility_off',
  activate: 'visibility',
  requestReview: 'rate_review',
  manageDiscount: 'local_offer',
  delete: 'delete_forever',
};

export default function ProductAdminActionsSection({ actions = [], loading }) {
  if (actions.length === 0) return null;

  return (
    <ProductSection title="Admin Actions" icon="admin_panel_settings">
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
            <span className="material-symbols-outlined text-[18px]">{ICONS[action.key]}</span>
            {action.label}
          </button>
        ))}
      </div>
    </ProductSection>
  );
}

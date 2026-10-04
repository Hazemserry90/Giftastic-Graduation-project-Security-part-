import UserSection from './UserSection';

const tones = {
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  neutral: 'bg-slate-700 text-white hover:bg-slate-800',
};

export default function UserActionsSection({ actions, loading }) {
  if (actions.length === 0) return null;
  return (
    <UserSection title="User Actions" icon="admin_panel_settings">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button key={action.key} type="button" onClick={action.onSelect} disabled={loading} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${tones[action.tone]}`}>
            <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </UserSection>
  );
}

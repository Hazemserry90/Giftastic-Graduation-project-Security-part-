import { hasLoadedEntityField } from '../shared/entityModel';
import { formatReminderDate } from './reminderSelectors';

export default function ReminderSummary({ reminder, access, actions = [], actionLoading = false }) {
  if (!reminder || !access?.canRead) return null;
  return (
    <article className="bg-white p-8 rounded-2xl shadow-plum border border-outline-variant transition-all hover:translate-y-[-4px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">Reminder</p>
          {hasLoadedEntityField(reminder, 'description') && (
            <h3 className="font-headline-md text-headline-md text-primary">{reminder.description}</h3>
          )}
        </div>
        <div className="bg-primary/5 p-3 rounded-xl">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
        </div>
      </div>
      {hasLoadedEntityField(reminder, 'scheduledAt') && reminder.scheduledAt && (
        <p className="font-body-md text-on-surface-variant mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {formatReminderDate(reminder.scheduledAt)}
        </p>
      )}
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => action.onSelect(reminder)}
          disabled={actionLoading}
          className={`mt-3 w-full rounded-xl border px-4 py-2 font-bold disabled:opacity-50 ${action.tone === 'danger' ? 'border-error text-error' : 'border-primary text-primary'}`}
        >
          {action.label}
        </button>
      ))}
    </article>
  );
}

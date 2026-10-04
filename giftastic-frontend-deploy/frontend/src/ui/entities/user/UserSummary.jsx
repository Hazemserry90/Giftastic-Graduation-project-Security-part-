import { getReadableUserField, getUserDisplayName } from './userSelectors';

export default function UserSummary({ model, access, onClick, compact = false }) {
  if (!model) return null;
  const email = getReadableUserField(model, 'email', access?.fields?.email).value;
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container">
        <span className="material-symbols-outlined text-[20px] text-on-primary-container">person</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-primary group-hover:text-secondary">{getUserDisplayName(model, access)}</span>
        {email && <span className="block truncate text-xs text-on-surface-variant">{email}</span>}
      </span>
    </>
  );

  if (!onClick) {
    return <span className="flex min-w-0 items-center gap-3 text-left">{content}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={`group flex min-w-0 items-center gap-3 text-left ${compact ? '' : 'rounded-xl px-2 py-1 hover:bg-primary/5'}`}>
      {content}
    </button>
  );
}

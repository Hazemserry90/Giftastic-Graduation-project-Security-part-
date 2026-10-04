import { Link } from 'react-router-dom';
import { formatUserDate, getUserBadges, getUserDisplayName } from '../userSelectors';
import { hasLoadedUserField } from '../userModel';

const tones = {
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  indigo: 'bg-indigo-100 text-indigo-800',
  amber: 'bg-amber-100 text-amber-800',
};

export default function UserIdentitySection({ model, access, showPublicLink = false }) {
  const badges = getUserBadges(model, access);

  return (
    <section className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-container">
            <span className="material-symbols-outlined text-4xl text-on-primary-container">person</span>
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold text-primary">{getUserDisplayName(model, access)}</h2>
            {access.fields.email && hasLoadedUserField(model, 'email') && model.email && (
              <p className="mt-1 break-all text-sm text-on-surface-variant">{model.email}</p>
            )}
            {hasLoadedUserField(model, 'memberSince') && model.memberSince && (
              <p className="mt-2 text-xs text-on-surface-variant">
                Member since {formatUserDate(model.memberSince, { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {showPublicLink && model.id && (
          <Link to={`/users/${model.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:bg-primary/10">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Public Profile
          </Link>
        )}
      </div>

      {badges.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge.key} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${tones[badge.tone]}`}>
              <span className="material-symbols-outlined text-sm">{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

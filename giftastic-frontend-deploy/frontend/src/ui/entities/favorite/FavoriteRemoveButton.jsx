import { buildFavoriteActions } from './favoriteActions';

export default function FavoriteRemoveButton({ favorite, access, onRemove, className = '' }) {
  const action = buildFavoriteActions({
    favorite,
    access,
    handlers: { remove: onRemove },
  })[0];
  if (!action) return null;
  return (
    <button
      type="button"
      aria-label={action.label}
      onClick={() => action.onSelect(favorite)}
      className={className}
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
    </button>
  );
}

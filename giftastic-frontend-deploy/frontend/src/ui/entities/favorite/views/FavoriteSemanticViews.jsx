import { SemanticActionBar } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import { getFavoriteTarget } from '../favoriteSelectors';

export const FAVORITE_VIEW_SECTIONS = [];

export function FavoriteSummary({ entity, access }) {
  if (!entity || !access?.canRead) return null;
  const target = getFavoriteTarget(entity);
  if (!target) return <span role="status" className="text-sm text-red-700">Favorite target unavailable</span>;
  return (
    <span
      className="inline-flex min-h-11 items-center rounded-full bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary"
      data-entity-summary="favorite"
    >
      Saved {target.type === 'product' ? 'Product' : 'Gift Flow'}
    </span>
  );
}

export function FavoriteCard(props) { return <div className="h-full"><FavoriteSummary {...props} /></div>; }
export function FavoriteRow(props) { return <div role="row"><FavoriteSummary {...props} /></div>; }

export function FavoriteDetails({ entity, access, actions = [], pendingKey }) {
  return <div className="flex flex-wrap items-center gap-2"><FavoriteSummary entity={entity} access={access} /><SemanticActionBar actions={actions} pendingKey={pendingKey} /></div>;
}

export function FavoriteWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <FavoriteDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

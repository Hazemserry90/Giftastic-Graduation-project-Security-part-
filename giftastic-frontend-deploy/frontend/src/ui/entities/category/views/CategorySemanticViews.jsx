import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';

export const CATEGORY_VIEW_SECTIONS = [
  {
    "title": "Category",
    "fields": [
      {
        "path": "name"
      },
      {
        "path": "relations.productCount",
        "label": "Product count"
      }
    ]
  },
  {
    "title": "System",
    "fields": [
      {
        "path": "id"
      }
    ]
  }
];

export function CategorySummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="name" subtitlePath="id" />;
}

export function CategoryCard(props) { return <div className="h-full"><CategorySummary {...props} /></div>; }
export function CategoryRow(props) { return <div role="row"><CategorySummary {...props} /></div>; }

export function CategoryDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={CATEGORY_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function CategoryWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <CategoryDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

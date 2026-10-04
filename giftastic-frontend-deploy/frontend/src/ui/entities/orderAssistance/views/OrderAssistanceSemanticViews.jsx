import { SemanticEntityDetails, SemanticEntitySummary } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import {
  formatOrderAssistanceDate,
  getOrderAssistanceMessages,
  getOrderAssistanceSenderLabel,
  getOrderAssistanceShortReference,
  getOrderAssistanceStatusClass,
  getOrderAssistanceStatusLabel,
} from '../orderAssistanceSelectors';

export const ORDERASSISTANCE_VIEW_SECTIONS = [
  {
    "title": "Request",
    "fields": [
      {
        "path": "message"
      },
      {
        "path": "status"
      },
      {
        "path": "requestedAt",
        "label": "Requested",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Thread",
    "fields": [
      {
        "path": "messages",
        "label": "Messages",
        "items": [
          {
            "path": "senderRole"
          },
          {
            "path": "message"
          },
          {
            "path": "createdAt",
            "label": "Sent",
            "format": "datetime"
          }
        ]
      }
    ]
  },
  {
    "title": "Resolution",
    "fields": [
      {
        "path": "resolvedAt",
        "label": "Resolved",
        "format": "datetime"
      },
      {
        "path": "resolvedBy"
      },
      {
        "path": "resolution"
      }
    ]
  },
  {
    "title": "References",
    "fields": [
      {
        "path": "id"
      },
      {
        "path": "orderId"
      },
      {
        "path": "supplierId"
      },
      {
        "path": "supplierName"
      }
    ]
  }
];

export function OrderAssistanceSummary({ entity, access }) {
  return <SemanticEntitySummary entity={entity} access={access} titlePath="message" subtitlePath="status" />;
}

export function OrderAssistanceCard(props) { return <div className="h-full"><OrderAssistanceSummary {...props} /></div>; }
export function OrderAssistanceRow(props) { return <div role="row"><OrderAssistanceSummary {...props} /></div>; }

export function OrderAssistanceAdminCard({ entity, access, onSelect }) {
  if (!entity || !access?.canRead) return null;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4" data-entity-summary="orderAssistance">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="break-words font-bold text-slate-800">{entity.supplierName || 'Vendor'}</h5>
          <p className="mb-1.5 text-xs text-slate-500">
            Request #{getOrderAssistanceShortReference(entity.id)} · Order #{getOrderAssistanceShortReference(entity.orderId)}
          </p>
          {entity.message && <p className="break-words text-sm text-slate-600">{entity.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getOrderAssistanceStatusClass(entity.status)}`}>
            {getOrderAssistanceStatusLabel(entity.status)}
          </span>
          <button
            type="button"
            onClick={() => onSelect?.(entity)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export function OrderAssistanceThread({ entity, access }) {
  if (!entity || !access?.canRead) return null;
  const messages = getOrderAssistanceMessages(entity);
  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-800">{entity.supplierName || 'Vendor'}</h3>
          <p className="break-all text-xs text-slate-500">
            Request #{entity.id || '-'} · Order #{entity.orderId || '-'}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getOrderAssistanceStatusClass(entity.status)}`}>
          {getOrderAssistanceStatusLabel(entity.status)}
        </span>
      </header>
      <section className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3" aria-label="Assistance messages">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-400">No messages yet.</p>
        ) : (
          <ol className="grid gap-2.5">
            {messages.map((message, index) => (
              <li key={message.id || `${message.createdAt || 'message'}-${index}`}>
                <p className="text-xs text-slate-500">
                  {getOrderAssistanceSenderLabel(message.senderRole)} · {formatOrderAssistanceDate(message.createdAt) || '-'}
                </p>
                <p className="break-words text-sm text-slate-800">{message.message}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function OrderAssistanceDetails({ entity, access, state, actions = [], pendingKey }) {
  return <SemanticEntityDetails entity={entity} access={access} sections={ORDERASSISTANCE_VIEW_SECTIONS} actions={actions} state={state} pendingKey={pendingKey} />;
}

export function OrderAssistanceWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <OrderAssistanceDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

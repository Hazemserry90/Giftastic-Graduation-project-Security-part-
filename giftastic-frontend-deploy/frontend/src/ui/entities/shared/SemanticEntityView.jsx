import { ENTITY_FIELD_STATE, getEntityValue, readEntityField } from './entityModel';
import { formatDecimal, formatMoney, formatRatePercent } from './decimal';
import { formatEntityDate, formatEntityDateTime } from './date';

const SEMANTIC_SECTION_ACCESS = Object.freeze({
  user: { Identity: 'sections.identity', Contact: 'sections.contact', Addresses: 'sections.addresses', Account: 'sections.accountStatus', 'Vendor facet': 'sections.vendorFacet', 'Admin facet': 'sections.adminFacet', 'Review restriction': 'sections.reviewRestriction' },
  vendor: { Storefront: 'canRead', Contact: 'canRead', Social: 'canRead', Status: 'sections.status', System: 'sections.system' },
  product: { Commerce: 'sections.hero', 'Media and taxonomy': 'sections.categories', Inventory: 'sections.inventory', 'Review request': 'fields.status', Personalization: 'sections.giftOptions', Delivery: 'sections.delivery', 'Vendor data': 'sections.vendorInfo', System: 'sections.system' },
  order: { Order: 'sections.header', Customer: 'sections.customer', Items: 'sections.items', Totals: 'sections.summary', Shipping: 'sections.shipping', Payment: 'sections.payment', Commission: 'sections.commission' },
  giftFlow: { Flow: 'sections.hero', Journey: 'sections.structure', Vendor: 'sections.vendor', System: 'sections.system' },
  cart: { Items: 'sections.items', Total: 'sections.totals', System: 'canViewSystem' },
  review: { Review: 'canRead', Author: 'canRead', Target: 'canRead', Moderation: 'fields.moderation' },
  category: { Category: 'canRead', System: 'canViewSystem' },
  vendorApplication: { Storefront: 'canRead', Contact: 'canRead', Timeline: 'canRead', System: 'canViewSystem' },
  commission: { Commission: 'canRead', Timeline: 'canRead', References: 'canRead' },
  commissionPaymentRequest: { Request: 'canRead', System: 'canRead' },
  commissionRule: { Rule: 'canRead', Scope: 'canRead', System: 'canViewSystem' },
  report: { Report: 'canRead', Timeline: 'canRead', Administration: 'canViewAdminNotes', References: 'canRead' },
  adminRequest: { Request: 'canRead', Outcome: 'canRead', Applicant: 'canRead', System: 'canViewSystem' },
  orderAssistance: { Request: 'canRead', Thread: 'canRead', Resolution: 'canRead', References: 'canRead' },
  notification: { Notification: 'canRead', 'Related entity': 'canRead', System: 'canViewSystem' },
  vendorFeedback: { Feedback: 'canRead', Moderation: 'canViewModeration', References: 'canRead' },
  deliveryZone: { Zone: 'canRead', System: 'canViewSystem' },
  vendorDeliveryPricing: { Pricing: 'canRead', Identity: 'canRead' },
  reminder: { Reminder: 'sections.reminder', System: 'canViewSystem' },
  vendorActivity: { Activity: 'sections.activity', 'Related entity': 'sections.metadata', System: 'canViewSystem' },
  userReviewRestriction: { Capabilities: 'canRead', Restriction: 'canRead', System: 'canViewSystem' },
});

const SEMANTIC_FIELD_ACCESS = Object.freeze({
  commissionPaymentRequest: { proofImageUrl: 'canViewProof', id: 'canViewSystem', supplierId: 'canViewSystem', reviewedBy: 'canViewSystem' },
  report: { reviewedBy: 'canViewAdminNotes', adminNotes: 'canViewAdminNotes', id: 'canViewSystem', reporterId: 'canViewSystem' },
  adminRequest: { reviewedBy: 'canViewSystem', id: 'canViewSystem' },
  vendorApplication: { reviewedBy: 'canViewSystem', id: 'canViewSystem', userId: 'canViewSystem' },
  vendorFeedback: { reviewedBy: 'canViewSystem', id: 'canViewSystem', userId: 'canViewSystem' },
  userReviewRestriction: { restrictedBy: 'canViewAdministrator', userId: 'canViewSystem' },
  order: { customerId: 'canViewSystem', deliveryCost: 'fields.deliveryCost' },
});

function readAccessFlag(access, path) {
  return String(path).split('.').reduce((value, key) => value?.[key], access) === true;
}

function semanticSectionAllowed(entity, access, section) {
  const path = section.accessKey || SEMANTIC_SECTION_ACCESS[entity?.entityType]?.[section.title];
  return Boolean(path && readAccessFlag(access, path));
}

const labelize = (path) => path.split('.').at(-1)
  .replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

export function fieldAllowed(access, field, entityType) {
  if (!access?.canRead) return false;
  if (field.accessKey && Object.hasOwn(access.fields || {}, field.accessKey)) return Boolean(access.fields[field.accessKey]);
  if (Object.hasOwn(access.fields || {}, field.path)) return Boolean(access.fields[field.path]);
  const mapped = SEMANTIC_FIELD_ACCESS[entityType]?.[field.path];
  if (mapped) return readAccessFlag(access, mapped);
  return true;
}

export function formatSemanticValue(value, format) {
  if (value === null || value === undefined) return null;
  if (format === 'money') return formatMoney(value);
  if (format === 'percent') return formatRatePercent(value);
  if (format === 'decimal') return formatDecimal(value, { maximumFractionDigits: 2 });
  if (format === 'rating') return formatDecimal(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (format === 'date') return formatEntityDate(value);
  if (format === 'datetime') return formatEntityDateTime(value);
  if (format === 'boolean') return value ? 'Yes' : 'No';
  if (format === 'count') return Array.isArray(value) ? String(value.length) : null;
  if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
  return null;
}

function SemanticField({ entity, access, field }) {
  const result = readEntityField(entity, field.path, fieldAllowed(access, field, entity.entityType));
  if ([ENTITY_FIELD_STATE.UNLOADED, ENTITY_FIELD_STATE.FORBIDDEN].includes(result.state)) return null;
  const label = field.label || labelize(field.path);
  if (result.state === ENTITY_FIELD_STATE.INVALID) {
    return <div><dt className="text-xs font-semibold text-red-700">{label}</dt><dd className="text-sm text-red-700">Data unavailable</dd></div>;
  }
  if (result.state === ENTITY_FIELD_STATE.EMPTY) {
    return <div><dt className="text-xs font-semibold text-stone-500">{label}</dt><dd className="text-sm text-stone-500">{field.emptyLabel || 'Not provided'}</dd></div>;
  }
  const selectedValue = typeof field.select === 'function' ? field.select(entity, access, result.value) : result.value;
  if (field.items && Array.isArray(selectedValue)) {
    return (
      <div className="sm:col-span-2">
        <dt className="text-xs font-semibold text-stone-500">{label}</dt>
        <dd className="mt-2">
          <ul className="grid gap-2" aria-label={label}>
            {selectedValue.map((item, index) => (
              <li key={item?.id || item?.productId || item?.requestId || index} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <dl className="grid gap-2 sm:grid-cols-2">
                  {field.items.map((child) => {
                    const value = getEntityValue(item, child.path);
                    const rendered = formatSemanticValue(value, child.format);
                    if (rendered === null) return null;
                    return <div key={child.path}><dt className="text-xs text-stone-500">{child.label || labelize(child.path)}</dt><dd className="text-sm font-medium text-stone-900">{rendered}</dd></div>;
                  })}
                </dl>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    );
  }
  const rendered = formatSemanticValue(selectedValue, field.format);
  if (rendered === null) return null;
  return <div className="min-w-0"><dt className="text-xs font-semibold text-stone-500">{label}</dt><dd className="max-w-full break-words [overflow-wrap:anywhere] text-sm font-medium text-stone-900">{rendered}</dd></div>;
}

export function SemanticActionBar({ actions = [], pendingKey }) {
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-label="Available actions">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={Boolean(pendingKey)}
          onClick={action.onSelect}
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${action.intent === 'danger' || action.tone === 'danger' ? 'bg-red-700 text-white' : 'bg-primary text-white'} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {pendingKey === action.key ? 'Working…' : action.label}
          {action.disabledReason && <span className="sr-only">{action.disabledReason}</span>}
        </button>
      ))}
    </div>
  );
}

export function SemanticEntityDetails({ entity, access, sections, actions, state = 'ready', title, pendingKey, showHeader = true }) {
  if (state === 'loading') return <div role="status" className="rounded-xl border border-stone-200 p-6">Loading entity…</div>;
  if (state === 'recoverable-error') return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">Unable to load additional details. Existing data is preserved.</div>;
  if (!entity || state === 'empty') return <div role="status" className="rounded-xl border border-stone-200 p-6">No entity data.</div>;
  if (!access?.canRead) return <div role="status" className="rounded-xl border border-stone-200 p-6">This information is not available in the current context.</div>;
  return (
    <article className="grid min-w-0 gap-4" data-entity-type={entity.entityType} data-view-state={entity.meta.isPartial ? 'partial' : state}>
      {showHeader && <header className="min-w-0 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="break-words text-xl font-bold text-primary">{title || entity.entityType}</h2>
        {entity.meta.isPartial && <p role="status" className="mt-2 text-sm text-amber-800">Partial data. More details may be loaded by the page.</p>}
        {entity.meta.issues.length > 0 && <p role="alert" className="mt-2 text-sm text-red-700">Some supplied fields could not be displayed safely.</p>}
      </header>}
      {sections.map((section) => {
        if (!semanticSectionAllowed(entity, access, section)) return null;
        return (
          <section key={section.title} className="min-w-0 rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">{section.title}</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => <SemanticField key={field.path} entity={entity} access={access} field={field} />)}
            </dl>
          </section>
        );
      })}
      <SemanticActionBar actions={actions} pendingKey={pendingKey} />
    </article>
  );
}

export function SemanticEntitySummary({ entity, access, titlePath, subtitlePath, badges = [] }) {
  if (!entity || !access?.canRead) return null;
  const title = readEntityField(entity, titlePath, fieldAllowed(access, { path: titlePath }, entity.entityType)).value;
  const subtitle = subtitlePath ? readEntityField(entity, subtitlePath, fieldAllowed(access, { path: subtitlePath }, entity.entityType)).value : null;
  return (
    <article className="min-w-0 rounded-xl border border-stone-200 bg-white p-4" data-entity-summary={entity.entityType}>
      <h3 className="break-words font-semibold text-primary">{formatSemanticValue(title) || entity.entityType}</h3>
      {formatSemanticValue(subtitle) && <p className="mt-1 text-sm text-stone-600">{formatSemanticValue(subtitle)}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{badges.map((badge) => <span key={badge} className="rounded-full bg-stone-100 px-2 py-1 text-xs">{badge}</span>)}</div>
    </article>
  );
}

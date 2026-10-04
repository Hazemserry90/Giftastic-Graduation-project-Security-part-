import { Link } from 'react-router-dom';
import { SemanticActionBar } from '../../shared/SemanticEntityView';
import { buildEntityActions } from '../../shared/entityActions';
import { Star } from 'lucide-react';
import UserSummary from '../../user/UserSummary';
import { adaptUser } from '../../user/userAdapters';
import { buildUserAccess, USER_CONTEXT } from '../../user/userAccess';
import {
  formatReviewContentScore,
  formatReviewDate,
  getReviewAuthorName,
  getReviewContentScoreClass,
  getReviewStarCount,
  getReviewStatusClass,
} from '../reviewSelectors';

export const REVIEW_VIEW_SECTIONS = [
  {
    "title": "Review",
    "fields": [
      {
        "path": "rating",
        "label": "Rating",
        "format": "rating"
      },
      {
        "path": "comment"
      },
      {
        "path": "reviewType"
      },
      {
        "path": "createdAt",
        "label": "Created",
        "format": "datetime"
      }
    ]
  },
  {
    "title": "Author",
    "fields": [
      {
        "path": "userId",
        "label": "Author ID",
        "accessKey": "author"
      },
      {
        "path": "isAnonymous",
        "label": "Anonymous",
        "format": "boolean",
        "accessKey": "author"
      }
    ]
  },
  {
    "title": "Target",
    "fields": [
      {
        "path": "entityId"
      },
      {
        "path": "orderId"
      }
    ]
  },
  {
    "title": "Moderation",
    "fields": [
      {
        "path": "status",
        "accessKey": "status"
      },
      {
        "path": "reviewedAt",
        "label": "Reviewed",
        "format": "datetime",
        "accessKey": "moderation"
      },
      {
        "path": "reviewedBy",
        "accessKey": "moderation"
      },
      {
        "path": "moderatorNotes",
        "accessKey": "moderation"
      },
      {
        "path": "contentScore",
        "label": "Content score",
        "format": "decimal",
        "accessKey": "moderation"
      }
    ]
  }
];

export function ReviewSummary({ entity, access }) {
  if (!entity || !access?.canRead) return null;
  const rating = getReviewStarCount(entity.rating);
  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-4" data-entity-summary="review">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ReviewCustomerReference entity={entity} access={access} compact />
          <p className="text-sm text-stone-600">
            {formatReviewDate(entity.createdAt) || 'Review'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
          <ReviewStars rating={entity.rating} />
          <span>{rating} / 5</span>
        </div>
      </div>
      {entity.comment ? (
        <p className="break-words text-sm text-stone-900">{entity.comment}</p>
      ) : (
        <p className="text-sm text-stone-500">No written comment.</p>
      )}
    </div>
  );
}

export function ReviewCard(props) { return <div className="h-full"><ReviewSummary {...props} /></div>; }
export function ReviewRow(props) { return <div role="row"><ReviewSummary {...props} /></div>; }

function ReviewStars({ rating }) {
  const count = getReviewStarCount(rating);
  return (
    <span className="flex items-center gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${index < count ? 'fill-[#FFD700] text-[#FFD700]' : 'text-[#cec3ce]'}`}
        />
      ))}
    </span>
  );
}

export function ReviewModerationCard({ entity, access, selected = false, onSelect }) {
  if (!entity || !access?.canRead) return null;
  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(entity);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(entity)}
      onKeyDown={handleKeyDown}
      className={`block w-full rounded-xl bg-white p-6 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
        selected
          ? 'ring-2 ring-[#341547] shadow-[0_4px_16px_rgba(52,21,71,0.12)]'
          : 'shadow-[0_2px_8px_rgba(52,21,71,0.08)] hover:shadow-[0_4px_16px_rgba(52,21,71,0.12)]'
      }`}
      data-entity-summary="review"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="min-w-0">
            <ReviewCustomerReference entity={entity} access={access} compact />
            <span className="block text-sm font-manrope text-[#4b444d]">
              {formatReviewDate(entity.createdAt) || '-'}
            </span>
          </span>
        </div>
        <ReviewStars rating={entity.rating} />
      </div>
      {entity.comment && <p className="line-clamp-3 font-manrope text-[#1b1c1a]">{entity.comment}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-plus-jakarta font-semibold ${getReviewContentScoreClass(entity.contentScore)}`}>
          Score: {formatReviewContentScore(entity.contentScore) || '-'}
        </span>
        {entity.reviewType && <span className="text-xs font-manrope text-[#4b444d]">{entity.reviewType}</span>}
      </div>
    </div>
  );
}

export function ReviewModerationExcerpt({ entity, access }) {
  if (!entity || !access?.canRead) return null;
  return (
    <div className="rounded-lg bg-[#f5f3f0] p-4">
      <ReviewStars rating={entity.rating} />
      {entity.comment && <p className="mt-2 font-manrope text-[#1b1c1a]">{entity.comment}</p>}
    </div>
  );
}

function CustomerReviewDetails({ entity, access, state }) {
  if (state === 'loading') return <div role="status" className="rounded-xl border border-stone-200 p-6">Loading review...</div>;
  if (state === 'recoverable-error') return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">Unable to load review details.</div>;
  if (!entity || state === 'empty') return <div role="status" className="rounded-xl border border-stone-200 p-6">No review data.</div>;
  if (!access?.canRead) return <div role="status" className="rounded-xl border border-stone-200 p-6">This review is not available.</div>;
  const rating = getReviewStarCount(entity.rating);

  return (
    <article className="grid min-w-0 gap-4" data-entity-type="review">
      <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">Review</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
          <ReviewStars rating={entity.rating} />
          <span>{rating} / 5</span>
        </div>
        {entity.comment ? (
          <p className="mt-4 break-words text-sm text-stone-900">{entity.comment}</p>
        ) : (
          <p className="mt-4 text-sm text-stone-500">No written comment.</p>
        )}
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailField label="Customer">
            <ReviewCustomerReference entity={entity} access={access} />
          </DetailField>
          <DetailField label="Created" value={formatReviewDate(entity.createdAt) || 'Not provided'} />
          {entity.reviewType && <DetailField label="Type" value={entity.reviewType} />}
          {entity.entityId && <DetailField label="Target" value={entity.entityId} />}
          {entity.orderId && <DetailField label="Order" value={entity.orderId} />}
          {access.fields?.status && entity.status && (
            <DetailField label="Status">
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getReviewStatusClass(entity.status)}`}>
                {entity.status}
              </span>
            </DetailField>
          )}
        </dl>
      </section>
      {access.fields?.moderation && (
        <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">Moderation</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Content score" value={formatReviewContentScore(entity.contentScore) || 'Not provided'} />
            <DetailField label="Reviewed" value={formatReviewDate(entity.reviewedAt) || 'Not reviewed'} />
            {entity.reviewedBy && <DetailField label="Reviewed by" value={entity.reviewedBy} />}
            {entity.moderatorNotes && <DetailField label="Notes" value={entity.moderatorNotes} />}
          </dl>
        </section>
      )}
    </article>
  );
}

export function ReviewDetails({ entity, access, state, actions = [], pendingKey }) {
  return (
    <>
      <CustomerReviewDetails entity={entity} access={access} state={state} />
      <SemanticActionBar actions={actions} pendingKey={pendingKey} />
    </>
  );
}

export function ReviewWorkflow({ entity, access, handlers, state, pendingKey }) {
  const actions = buildEntityActions({ entity, access, handlers });
  return <ReviewDetails entity={entity} access={access} actions={actions} state={state} pendingKey={pendingKey} />;
}

function ReviewCustomerReference({ entity, access, compact = false }) {
  const canViewAuthor = Boolean(access?.fields?.author);
  const label = getReviewAuthorName(entity, canViewAuthor);
  if (entity?.isAnonymous && !canViewAuthor) {
    return <span className="text-sm font-semibold text-primary">{label}</span>;
  }

  const customer = adaptUser({
    id: entity?.userId || null,
    fullName: label,
  }, { source: 'review-customer-reference' });
  const customerAccess = buildUserAccess({ user: customer, viewer: null, context: USER_CONTEXT.PUBLIC });
  const summary = <UserSummary model={customer} access={customerAccess} compact={compact} />;

  if (!entity?.userId) return summary;

  return (
    <Link
      to={`/users/${entity.userId}`}
      onClick={(event) => event.stopPropagation()}
      className="group inline-flex max-w-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {summary}
      <span className="sr-only">Open customer profile</span>
    </Link>
  );
}

function DetailField({ label, value, children }) {
  if ((value === null || value === undefined || value === '') && !children) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-stone-500">{label}</dt>
      <dd className="max-w-full break-words [overflow-wrap:anywhere] text-sm font-medium text-stone-900">
        {children || value}
      </dd>
    </div>
  );
}

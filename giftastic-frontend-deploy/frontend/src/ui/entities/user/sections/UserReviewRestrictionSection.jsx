import UserSection from './UserSection';
import UserField from './UserField';
import { formatUserDateTime } from '../userSelectors';
import { hasLoadedUserField } from '../userModel';

export default function UserReviewRestrictionSection({ model, access }) {
  if (!access.sections.reviewRestriction) return null;
  return (
    <UserSection title="Review Restrictions" icon="comments_disabled">
      <div className="mb-4 flex flex-wrap gap-2">
        {hasLoadedUserField(model, 'facets.reviewRestriction.canReview') && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.facets.reviewRestriction.canReview ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {model.facets.reviewRestriction.canReview ? 'Can review' : 'Reviews restricted'}
          </span>
        )}
        {hasLoadedUserField(model, 'facets.reviewRestriction.canComment') && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.facets.reviewRestriction.canComment ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {model.facets.reviewRestriction.canComment ? 'Can comment' : 'Comments restricted'}
          </span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <UserField model={model} path="facets.reviewRestriction.reason" allowed={access.fields.reviewRestriction} label="Reason" />
        <UserField model={model} path="facets.reviewRestriction.expiresAt" allowed={access.fields.reviewRestriction} label="Expires" format={formatUserDateTime} />
      </div>
    </UserSection>
  );
}

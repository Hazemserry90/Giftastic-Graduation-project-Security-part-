import UserIdentitySection from './sections/UserIdentitySection';
import UserContactSection from './sections/UserContactSection';
import UserAddressesSection from './sections/UserAddressesSection';
import UserAccountStatusSection from './sections/UserAccountStatusSection';
import UserAccountFacetsSection from './sections/UserAccountFacetsSection';
import UserReviewRestrictionSection from './sections/UserReviewRestrictionSection';
import UserSystemSection from './sections/UserSystemSection';
import UserActionsSection from './sections/UserActionsSection';

export default function UserDetails({
  model,
  access,
  actions = [],
  actionLoading = false,
  showPublicLink = false,
  renderAdminHistory,
}) {
  return (
    <div className="grid gap-4">
      <UserIdentitySection model={model} access={access} showPublicLink={showPublicLink} />
      <UserContactSection model={model} access={access} />
      <UserAddressesSection model={model} access={access} />
      <UserAccountStatusSection model={model} access={access} />
      <UserAccountFacetsSection model={model} access={access} />
      <UserReviewRestrictionSection model={model} access={access} />
      {access.sections.adminHistory && renderAdminHistory?.()}
      <UserActionsSection actions={actions} loading={actionLoading} />
      <UserSystemSection model={model} access={access} />
    </div>
  );
}

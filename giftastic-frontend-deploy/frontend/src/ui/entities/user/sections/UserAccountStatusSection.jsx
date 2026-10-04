import UserSection from './UserSection';
import { hasLoadedUserField } from '../userModel';

export default function UserAccountStatusSection({ model, access }) {
  if (!access.sections.accountStatus) return null;
  return (
    <UserSection title="Account Status" icon="manage_accounts">
      <div className="flex flex-wrap gap-2">
        {access.fields.isBanned && hasLoadedUserField(model, 'isBanned') && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.isBanned ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {model.isBanned ? 'Banned' : 'Active'}
          </span>
        )}
        {access.fields.requestedAdmin && hasLoadedUserField(model, 'requestedAdmin') && model.requestedAdmin === true && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">Admin requested</span>
        )}
      </div>
    </UserSection>
  );
}

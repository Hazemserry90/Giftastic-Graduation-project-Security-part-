import UserSummary from './UserSummary';
import { getUserStatusClass, getUserStatusLabel } from './userSelectors';

export default function UserManagementRow({
  user,
  access,
  actions = [],
  loading = false,
  onDetails,
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3">
        <UserSummary model={user} access={access} onClick={() => onDetails?.(user)} />
      </td>
      <td className="px-4 py-3">
        {access.fields.phoneNumber && user.phoneNumber && <div className="text-xs text-slate-600">{user.phoneNumber}</div>}
        {access.fields.birthday && user.birthday && <div className="mt-0.5 text-xs text-slate-600">{user.birthday}</div>}
        {access.fields.addresses && user.addresses?.length > 0 && (
          <div className="mt-0.5 text-[11px] text-slate-400">{user.addresses.length} address(es)</div>
        )}
      </td>
      <td className="px-4 py-3">
        {access.fields.isBanned && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getUserStatusClass(user)}`}>
            {getUserStatusLabel(user)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onDetails?.(user)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600">
            Details
          </button>
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onSelect}
              disabled={loading}
              className={`rounded-md px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${action.intent === 'danger' || action.key === 'ban' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

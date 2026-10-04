import { getReadableUserField } from '../userSelectors';
import { USER_FIELD_STATE } from '../userModel';

export default function UserField({ model, path, allowed, label, format = (value) => value }) {
  const field = getReadableUserField(model, path, allowed);
  if (field.state === USER_FIELD_STATE.FORBIDDEN || field.state === USER_FIELD_STATE.UNLOADED) {
    return null;
  }

  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</div>
      <div className="break-words text-sm text-on-surface">
        {field.state === USER_FIELD_STATE.EMPTY ? 'Not provided' : format(field.value)}
      </div>
    </div>
  );
}

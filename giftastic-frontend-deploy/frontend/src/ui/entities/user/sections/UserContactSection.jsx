import UserSection from './UserSection';
import UserField from './UserField';
import { formatUserDate } from '../userSelectors';

export default function UserContactSection({ model, access }) {
  if (!access.sections.contact) return null;
  return (
    <UserSection title="Contact" icon="contact_mail">
      <div className="grid gap-4 sm:grid-cols-2">
        <UserField model={model} path="phoneNumber" allowed={access.fields.phoneNumber} label="Phone Number" />
        <UserField model={model} path="birthday" allowed={access.fields.birthday} label="Birthday" format={formatUserDate} />
      </div>
    </UserSection>
  );
}

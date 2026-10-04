import UserSection from './UserSection';
import UserField from './UserField';

export default function UserSystemSection({ model, access }) {
  if (!access.sections.system) return null;
  return (
    <UserSection title="System" icon="database">
      <div className="grid gap-4">
        <UserField model={model} path="id" allowed={access.fields.id} label="User ID" />
        <UserField model={model} path="facets.vendor.supplierId" allowed={access.fields.supplierId} label="Supplier ID" />
        <UserField model={model} path="facets.vendor.vendorId" allowed={access.fields.vendorId} label="Vendor ID" />
      </div>
    </UserSection>
  );
}

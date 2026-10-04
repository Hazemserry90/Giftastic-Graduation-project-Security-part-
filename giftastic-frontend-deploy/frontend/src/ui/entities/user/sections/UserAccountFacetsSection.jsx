import { Link } from 'react-router-dom';
import UserSection from './UserSection';

export default function UserAccountFacetsSection({ model, access }) {
  const vendor = model.facets.vendor;
  const admin = model.facets.admin;
  const showVendor = access.sections.vendorFacet && vendor.isVendor === true;
  const showAdmin = access.sections.adminFacet;
  if (!showVendor && !showAdmin) return null;

  return (
    <UserSection title="Account Capabilities" icon="badge">
      <div className="grid gap-4">
        {showVendor && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 p-4">
            <div>
              <div className="font-bold text-primary">Vendor account</div>
              <div className="text-sm text-on-surface-variant">This User has a linked Vendor storefront.</div>
            </div>
            {vendor.vendorId && (
              <Link to={`/vendors/${vendor.vendorId}`} className="rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary">View Store</Link>
            )}
          </div>
        )}
        {showAdmin && admin.isAdmin === true && (
          <div className="rounded-xl bg-stone-50 p-4">
            <div className="font-bold text-primary">{admin.isSuperAdmin ? 'Super Admin' : 'Admin account'}</div>
            {access.fields.adminPermissions && admin.permissions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {admin.permissions.map((permission) => (
                  <span key={permission} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{permission}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </UserSection>
  );
}

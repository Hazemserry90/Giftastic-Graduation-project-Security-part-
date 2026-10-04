import VendorSection from './VendorSection';

export default function VendorStatusSection({ model, access }) {
  if (!access.sections.status) return null;
  return (
    <VendorSection title="Vendor Status" icon="verified_user">
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${model.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
        {model.isVerified ? 'Verified' : 'Pending / Inactive'}
      </span>
    </VendorSection>
  );
}

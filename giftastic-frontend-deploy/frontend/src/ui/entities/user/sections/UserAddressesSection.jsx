import UserSection from './UserSection';

function formatAddress(address) {
  return [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean).join(', ');
}

export default function UserAddressesSection({ model, access }) {
  if (!access.sections.addresses) return null;
  return (
    <UserSection title="Saved Addresses" icon="location_on">
      {model.addresses.length === 0 ? (
        <p className="text-sm italic text-on-surface-variant">No saved addresses available.</p>
      ) : (
        <div className="grid gap-3">
          {model.addresses.map((address, index) => (
            <div key={`${address.label || 'address'}-${index}`} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold text-primary">{address.label || `Address ${index + 1}`}</h4>
                {address.isDefault && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Default</span>}
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">{formatAddress(address) || 'Address details not provided'}</p>
            </div>
          ))}
        </div>
      )}
    </UserSection>
  );
}

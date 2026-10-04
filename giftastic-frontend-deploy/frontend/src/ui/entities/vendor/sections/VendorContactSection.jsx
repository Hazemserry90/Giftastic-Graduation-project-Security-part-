import VendorSection from './VendorSection';
import { hasLoadedVendorField } from '../vendorModel';
import { normalizeVendorUrl } from '../vendorSelectors';

function Item({ icon, label, value, href }) {
  if (value === null || value === undefined || value === '') return null;
  const content = (
    <>
      <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</span>
        <span className="block break-words text-sm text-on-surface">{value}</span>
      </span>
    </>
  );
  return href
    ? <a href={href} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl bg-stone-50 p-4 hover:bg-primary/5">{content}</a>
    : <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-4">{content}</div>;
}

export default function VendorContactSection({ model, access }) {
  if (!access.sections.contact) return null;
  return (
    <VendorSection title="Contact & Location" icon="contact_mail">
      <div className="grid gap-3 sm:grid-cols-2">
        {hasLoadedVendorField(model, 'contactEmail') && <Item icon="mail" label="Email" value={model.contactEmail} href={model.contactEmail ? `mailto:${model.contactEmail}` : ''} />}
        {hasLoadedVendorField(model, 'contactPhone') && <Item icon="call" label="Phone" value={model.contactPhone} href={model.contactPhone ? `tel:${model.contactPhone}` : ''} />}
        {hasLoadedVendorField(model, 'address') && <Item icon="location_on" label="Address" value={model.address} />}
        {hasLoadedVendorField(model, 'workingHours') && <Item icon="schedule" label="Working Hours" value={model.workingHours} />}
        {hasLoadedVendorField(model, 'websiteUrl') && <Item icon="language" label="Website" value={model.websiteUrl} href={normalizeVendorUrl(model.websiteUrl)} />}
      </div>
    </VendorSection>
  );
}

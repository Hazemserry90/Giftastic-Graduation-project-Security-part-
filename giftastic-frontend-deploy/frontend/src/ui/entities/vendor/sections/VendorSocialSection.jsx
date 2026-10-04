import VendorSection from './VendorSection';
import { hasLoadedVendorField } from '../vendorModel';
import { normalizeVendorUrl } from '../vendorSelectors';

export default function VendorSocialSection({ model, access }) {
  if (!access.sections.social) return null;
  const links = [
    hasLoadedVendorField(model, 'instagramUrl') && model.instagramUrl
      ? { key: 'instagram', label: 'Instagram', icon: 'photo_camera', href: normalizeVendorUrl(model.instagramUrl, 'https://instagram.com/') }
      : null,
    hasLoadedVendorField(model, 'facebookUrl') && model.facebookUrl
      ? { key: 'facebook', label: 'Facebook', icon: 'groups', href: normalizeVendorUrl(model.facebookUrl) }
      : null,
  ].filter(Boolean);
  if (links.length === 0) return null;
  return (
    <VendorSection title="Social Links" icon="share">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a key={link.key} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5">
            <span className="material-symbols-outlined text-[18px]">{link.icon}</span>{link.label}
          </a>
        ))}
      </div>
    </VendorSection>
  );
}

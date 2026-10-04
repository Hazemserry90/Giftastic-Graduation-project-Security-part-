import { hasLoadedEntityField } from '../shared/entityModel';
import { formatVendorDeliveryPricingDate } from './vendorDeliveryPricingSelectors';

export default function VendorDeliveryPricingEditor({
  zone,
  pricing,
  access,
  value,
  onChange,
}) {
  if (!zone || !pricing || !access?.canRead) return null;
  return (
    <div className="p-6 hover:bg-[#f5f3f0] transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-plus-jakarta font-semibold text-[#1b1c1a] mb-1">
            {zone.zoneName}
          </h3>
          {zone.description && (
            <p className="text-sm text-[#4b444d] font-manrope">{zone.description}</p>
          )}
          {hasLoadedEntityField(pricing, 'updatedAt') && pricing.updatedAt && (
            <p className="mt-1 text-xs text-[#4b444d]">
              Last updated: {formatVendorDeliveryPricingDate(pricing.updatedAt)}
            </p>
          )}
        </div>
        {access.canManage && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(event) => onChange?.(zone.id, event.target.value)}
              placeholder="0.00"
              className="w-32 px-4 py-2 border border-[#705a49] rounded-lg font-manrope text-[#1b1c1a] focus:outline-none focus:border-[#341547] focus:ring-2 focus:ring-[#341547]/20 transition-all"
            />
            <span className="font-manrope text-[#4b444d] font-semibold">EGP</span>
          </div>
        )}
      </div>
    </div>
  );
}

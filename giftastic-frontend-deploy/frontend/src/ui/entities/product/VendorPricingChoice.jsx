import { formatProductMoney } from './productSelectors';
import { formatRatePercent, normalizeRateFraction } from '../shared/decimal';

export const PRODUCT_PRICING_MODE = Object.freeze({
  CUSTOMER_PRICE: 'CUSTOMER_PRICE',
  GUARANTEED_VENDOR_PAYOUT: 'GUARANTEED_VENDOR_PAYOUT',
});

export function calculateVendorPricingPreview(amount, rate, mode) {
  const entered = Number(amount);
  const normalizedRate = normalizeRateFraction(rate);
  const commissionRate = Number(normalizedRate);
  if (!Number.isFinite(entered) || entered <= 0 || !Number.isFinite(commissionRate)) return null;
  let customerPrice = entered;
  if (mode === PRODUCT_PRICING_MODE.GUARANTEED_VENDOR_PAYOUT && commissionRate < 1) {
    customerPrice = Math.ceil((entered / (1 - commissionRate)) * 100) / 100;
  }
  const commission = Math.round(customerPrice * commissionRate * 100) / 100;
  return { customerPrice, commission, vendorPayout: customerPrice - commission };
}

export default function VendorPricingChoice({ amount, rate, value, onChange, showOptions = true }) {
  const percentage = formatRatePercent(rate) || 'the active rate';
  const preview = calculateVendorPricingPreview(amount, rate, value);
  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex gap-3">
        <span className="material-symbols-outlined text-amber-700">info</span>
        <div>
          <h3 className="font-bold text-amber-950">Important commission and pricing notice</h3>
          <p className="mt-1 text-sm text-amber-900">
            Giftastic currently applies {percentage} to each vendor’s own order subtotal. Rates may change.
            The rate active when the customer checks out is permanently recorded on that order and used for settlement.
          </p>
          <p className="mt-2 text-xs text-amber-800">
            Estimates exclude your taxes, costs, refunds, and other obligations. You remain responsible for choosing a suitable price.
          </p>
        </div>
      </div>
      {showOptions && <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => onChange(PRODUCT_PRICING_MODE.GUARANTEED_VENDOR_PAYOUT)}
          className={`rounded-xl border-2 p-4 text-left ${value === PRODUCT_PRICING_MODE.GUARANTEED_VENDOR_PAYOUT ? 'border-primary bg-white' : 'border-amber-200'}`}>
          <strong>Protect my payout</strong>
          <p className="mt-1 text-sm">The amount entered is what you receive. Commission is grossed up into the customer price.</p>
        </button>
        <button type="button" onClick={() => onChange(PRODUCT_PRICING_MODE.CUSTOMER_PRICE)}
          className={`rounded-xl border-2 p-4 text-left ${value === PRODUCT_PRICING_MODE.CUSTOMER_PRICE ? 'border-primary bg-white' : 'border-amber-200'}`}>
          <strong>Keep my entered customer price</strong>
          <p className="mt-1 text-sm">The amount entered is what the customer pays. Commission is deducted from your payout.</p>
        </button>
      </div>}
      {showOptions && preview && <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-white p-3 text-center text-sm">
        <div><span className="block text-xs text-gray-500">Customer pays</span><strong>{formatProductMoney(preview.customerPrice)}</strong></div>
        <div><span className="block text-xs text-gray-500">Commission</span><strong>{formatProductMoney(preview.commission)}</strong></div>
        <div><span className="block text-xs text-gray-500">You receive</span><strong>{formatProductMoney(preview.vendorPayout)}</strong></div>
      </div>}
    </section>
  );
}

// Canonical Product presentation section.
import ProductSection from './ProductSection';

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-primary">{String(value)}</dd>
    </div>
  );
}

export default function ProductVendorInfoSection({ product }) {
  const details = product?.details || {};
  const hasData = product?.supplierId || details.vendorSku || details.vendorNotes || details.fulfillmentTime || details.handmade || details.madeToOrder || details.customizable;
  if (!hasData) return null;

  return (
    <ProductSection title="Vendor Data" icon="storefront">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier ID" value={product?.supplierId} />
        <Field label="Vendor SKU" value={details.vendorSku} />
        <Field label="Fulfillment time" value={details.fulfillmentTime ? `${details.fulfillmentTime} days` : null} />
        <Field label="Handmade" value={details.handmade ? 'Yes' : null} />
        <Field label="Made to order" value={details.madeToOrder ? 'Yes' : null} />
        <Field label="Customizable" value={details.customizable ? 'Yes' : null} />
        <Field label="Vendor notes" value={details.vendorNotes} />
      </dl>
    </ProductSection>
  );
}

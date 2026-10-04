// Canonical Product presentation section.
import ProductSection from './ProductSection';
import { formatProductDate, formatProductMoney } from '../productSelectors';

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-primary">{String(value)}</dd>
    </div>
  );
}

export default function ProductInventorySection({ product }) {
  return (
    <ProductSection title="Inventory & Pricing" icon="warehouse">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Stock quantity" value={product?.stockQuantity !== undefined ? `${product.stockQuantity} units` : null} />
        <Field label="In stock" value={product?.inStock !== undefined ? (product.inStock ? 'Yes' : 'No') : null} />
        <Field label="Base price" value={formatProductMoney(product?.price ?? product?.originalPrice)} />
        <Field label="Current price" value={product?.currentPrice !== undefined ? formatProductMoney(product.currentPrice) : null} />
        <Field label="Discount" value={Number(product?.discountPercentage || 0) > 0 ? `${product.discountPercentage}%` : null} />
        <Field label="Discount starts" value={product?.discountStartDate ? formatProductDate(product.discountStartDate) : null} />
        <Field label="Discount ends" value={product?.discountEndDate ? formatProductDate(product.discountEndDate) : null} />
      </dl>
    </ProductSection>
  );
}

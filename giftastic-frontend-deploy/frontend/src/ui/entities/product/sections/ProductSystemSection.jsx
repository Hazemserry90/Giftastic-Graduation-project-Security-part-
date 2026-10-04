// Canonical Product presentation section.
import ProductSection from './ProductSection';
import { formatProductDate, getProductId } from '../productSelectors';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-all rounded-lg bg-stone-50 p-2 font-mono text-xs text-primary">{String(value)}</dd>
    </div>
  );
}

export default function ProductSystemSection({ product }) {
  return (
    <ProductSection title="System" icon="database">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Product ID" value={getProductId(product)} />
        <Field label="Supplier ID" value={product?.supplierId} />
        <Field label="Created at" value={formatProductDate(product?.createdAt)} />
        <Field label="Updated at" value={formatProductDate(product?.updatedAt)} />
        <Field label="Published at" value={formatProductDate(product?.publishedAt)} />
      </dl>
    </ProductSection>
  );
}

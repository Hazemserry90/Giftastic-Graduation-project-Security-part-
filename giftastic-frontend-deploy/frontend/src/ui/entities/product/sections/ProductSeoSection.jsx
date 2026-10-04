// Canonical Product presentation section.
import ProductSection from './ProductSection';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-primary">{String(value)}</dd>
    </div>
  );
}

export default function ProductSeoSection({ product }) {
  const details = product?.details || {};
  if (!details.slug && !details.metaTitle && !details.metaDescription && !details.videoUrl) return null;

  return (
    <ProductSection title="SEO & Media" icon="travel_explore">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" value={details.slug} />
        <Field label="Meta title" value={details.metaTitle} />
        <Field label="Meta description" value={details.metaDescription} />
        <Field label="Video URL" value={details.videoUrl} />
      </dl>
    </ProductSection>
  );
}

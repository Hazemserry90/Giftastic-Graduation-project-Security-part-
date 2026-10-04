// Canonical Product presentation section.
import ProductSection from './ProductSection';
import { getCategoryDisplayName } from '../../category';

function Pill({ children }) {
  return (
    <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
      {children}
    </span>
  );
}

export default function ProductTaxonomySection({ product }) {
  const details = product?.details || {};
  const categories = product?.categories || [];
  const tags = typeof details.tags === 'string'
    ? details.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
  const marketing = [
    details.isFeatured && 'Featured',
    details.isBestseller && 'Bestseller',
    details.isNewArrival && 'New arrival',
    details.gender && `Gender: ${details.gender}`,
    details.occasion && `Occasion: ${details.occasion}`,
    details.recipientType && `Recipient: ${details.recipientType}`,
    details.ageGroup && `Age: ${details.ageGroup}`,
    details.seasonalAvailability && `Season: ${details.seasonalAvailability}`,
    ...tags,
  ].filter(Boolean);

  if (categories.length === 0 && marketing.length === 0) return null;

  return (
    <ProductSection title="Discovery" icon="category">
      <div className="grid gap-4">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Pill key={category.id || index}>
                {getCategoryDisplayName(category)}
              </Pill>
            ))}
          </div>
        )}
        {marketing.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {marketing.map((item) => <Pill key={item}>{item}</Pill>)}
          </div>
        )}
      </div>
    </ProductSection>
  );
}

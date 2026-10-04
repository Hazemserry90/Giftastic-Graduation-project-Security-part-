// Canonical Product presentation section.
import ProductSection from './ProductSection';
import { formatProductMoney } from '../productSelectors';

function DetailPill({ children }) {
  return (
    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold text-primary">
      {children}
    </span>
  );
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-primary">{String(value)}</dd>
    </div>
  );
}

export default function ProductDetailsSection({ product, type }) {
  const details = product?.details || {};

  if (type === 'gift') {
    const options = [
      details.allowsEngraving && (details.engravingMaxLength
        ? `Engraving up to ${details.engravingMaxLength} chars`
        : 'Engraving available'),
      details.allowsCustomMessage && (details.maxMessageLength
        ? `Custom message up to ${details.maxMessageLength} chars`
        : 'Custom message available'),
      details.allowsPhotoUpload && 'Photo upload',
      details.allowsColorChoice && `Colors: ${details.availableColors || 'available'}`,
      details.allowsSizeChoice && `Sizes: ${details.availableSizes || 'available'}`,
      details.allowsGiftWrap && `Gift wrap ${details.giftWrapPrice ? `(${formatProductMoney(details.giftWrapPrice)})` : ''}`,
      details.includesGiftBox && 'Includes gift box',
      details.includesRibbon && 'Includes ribbon',
      details.allowsGiftReceipt && 'Gift receipt',
    ].filter(Boolean);

    if (options.length === 0) return null;

    return (
      <ProductSection title="Gift Options" icon="card_giftcard">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => <DetailPill key={option}>{option}</DetailPill>)}
        </div>
      </ProductSection>
    );
  }

  if (type === 'delivery') {
    const hasDeliveryData = details.requiresDeliveryDate || details.allowsScheduledDelivery || details.minDeliveryDays || details.maxDeliveryDays || details.isPerishable || details.shelfLifeDays;
    if (!hasDeliveryData) return null;
    return (
      <ProductSection title="Delivery" icon="local_shipping">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Requires delivery date" value={details.requiresDeliveryDate ? 'Yes' : null} />
          <Field label="Scheduled delivery" value={details.allowsScheduledDelivery ? 'Allowed' : null} />
          <Field label="Delivery window" value={details.minDeliveryDays || details.maxDeliveryDays ? `${details.minDeliveryDays || 0}-${details.maxDeliveryDays || '?'} days` : null} />
          <Field label="Perishable" value={details.isPerishable ? 'Yes' : null} />
          <Field label="Shelf life" value={details.shelfLifeDays ? `${details.shelfLifeDays} days` : null} />
        </dl>
      </ProductSection>
    );
  }

  if (type === 'recipient') {
    const requirements = [
      details.requiresRecipientName && 'Recipient name',
      details.requiresRecipientEmail && 'Recipient email',
      details.requiresRecipientPhone && 'Recipient phone',
      details.requiresRecipientAddress && 'Recipient address',
      details.allowsAnonymousGift && 'Anonymous gift allowed',
    ].filter(Boolean);

    if (!details.requiresRecipientInfo && requirements.length === 0) return null;

    return (
      <ProductSection title="Recipient Requirements" icon="person_pin_circle">
        <div className="flex flex-wrap gap-2">
          {requirements.map((requirement) => <DetailPill key={requirement}>{requirement}</DetailPill>)}
        </div>
      </ProductSection>
    );
  }

  if (type === 'composition') {
    const contents = [
      details.isContainer && 'Container',
      details.containsLetter && 'Letter',
      details.containsCard && 'Card',
      details.containsFlowers && 'Flowers',
      details.containsChocolates && 'Chocolates',
      details.containsFood && 'Food',
      details.itemCount && `${details.itemCount} items`,
    ].filter(Boolean);

    if (contents.length === 0) return null;

    return (
      <ProductSection title="Composition" icon="featured_seasonal_and_gifts">
        <div className="flex flex-wrap gap-2">
          {contents.map((content) => <DetailPill key={content}>{content}</DetailPill>)}
        </div>
      </ProductSection>
    );
  }

  return null;
}

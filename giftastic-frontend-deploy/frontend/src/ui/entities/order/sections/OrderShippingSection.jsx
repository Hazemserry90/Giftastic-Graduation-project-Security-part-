// Canonical Order presentation section.
import OrderSection from './OrderSection';

export default function OrderShippingSection({ order }) {
  return (
    <OrderSection title="Shipping" icon="local_shipping">
      <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
        {order?.shippingAddress || 'No shipping address provided.'}
      </p>
    </OrderSection>
  );
}


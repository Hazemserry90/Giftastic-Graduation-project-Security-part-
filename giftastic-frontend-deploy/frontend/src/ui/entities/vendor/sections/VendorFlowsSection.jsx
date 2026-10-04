import VendorSection from './VendorSection';
import { GiftFlowSummary } from '../../giftFlow';

export default function VendorFlowsSection({ flows = [], onPreview, accessFor }) {
  if (flows.length === 0) return null;

  return (
    <VendorSection title="Gift Flows Preview" icon="auto_awesome">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flows.slice(0, 6).map((flow) => (
          <GiftFlowSummary
            key={flow.id}
            flow={flow}
            access={accessFor?.(flow)}
            to={`/gift-flow/${flow.id}`}
            onPreview={onPreview}
          />
        ))}
      </div>
    </VendorSection>
  );
}

import { VendorSummary } from '../../ui/entities/vendor';

export default function VendorSummaryCard({
  entity,
  access,
  onPreview,
}) {
  if (!entity || !access?.canRead) return null;
  return <VendorSummary model={entity} access={access} onPreview={onPreview} />;
}

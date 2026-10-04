import EntityDialog from './EntityDialog';
import { ReportSemanticViews } from '../../ui/entities/report';

export default function ReportModal({ entity, access, actions = [], isOpen = true, onClose, actionLoading = false, pendingKey, children }) {
  if (!isOpen || !entity || !access?.canRead) return null;
  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title="Report Details" eyebrow="Report" maxWidth="max-w-4xl">
      {children}
      <ReportSemanticViews.ReportDetails entity={entity} access={access} actions={actions} pendingKey={pendingKey || (actionLoading ? actions[0]?.key : null)} />
    </EntityDialog>
  );
}

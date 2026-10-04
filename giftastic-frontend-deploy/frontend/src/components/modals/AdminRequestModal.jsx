import EntityDialog from './EntityDialog';
import { AdminRequestSemanticViews } from '../../ui/entities/adminRequest';
import { SemanticActionBar } from '../../ui/entities/shared/SemanticEntityView';

export default function AdminRequestModal({ entity, access, actions = [], isOpen = true, onClose, actionLoading = false, children }) {
  if (!isOpen || !entity || !access?.canRead) return null;
  return (
    <EntityDialog isOpen={isOpen} onClose={onClose} title="Admin Role Request" eyebrow="Admin request">
      {children}
      <div className="sticky top-0 z-10 mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3 shadow-sm">
        <SemanticActionBar actions={actions} pendingKey={actionLoading ? 'loading' : null} />
      </div>
      <AdminRequestSemanticViews.AdminRequestDetails entity={entity} access={access} actions={[]} />
    </EntityDialog>
  );
}

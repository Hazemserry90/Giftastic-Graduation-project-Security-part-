import { useEffect, useRef } from 'react';
import { UserDetails } from '../../ui/entities/user';

export default function UserModal({
  entity,
  access,
  actions = [],
  isOpen = true,
  onClose,
  actionLoading = false,
  title = 'User Details',
  showPublicLink = false,
  renderHeaderAction,
  renderAdminHistory,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isClosable = typeof onClose === 'function';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isClosable) return undefined;
    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
      if (event.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, isClosable]);

  if (!isOpen || !entity || !access) return null;

  const isModal = Boolean(onClose);
  const content = (
    <UserDetails
      model={entity}
      access={access}
      actions={actions}
      actionLoading={actionLoading}
      showPublicLink={showPublicLink}
      renderAdminHistory={renderAdminHistory}
    />
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close user details"
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-stone-50 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Unified Entity Modal</p>
            <h2 className="font-headline-md text-xl font-bold text-primary">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {renderHeaderAction?.(entity)}
            <button
              type="button"
              aria-label="Close user details"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>
        <div className="overflow-y-auto p-6">
          {content}
        </div>
      </div>
    </div>
  );
}

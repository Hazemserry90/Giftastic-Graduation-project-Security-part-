import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function EntityDialog({
  isOpen = true,
  onClose,
  title,
  eyebrow = 'Unified Entity',
  maxWidth = 'max-w-5xl',
  headerAction,
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const isClosable = typeof onClose === 'function';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isClosable) return undefined;
    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])];
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, isClosable]);

  if (!isOpen) return null;
  if (!onClose) return children;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl bg-stone-50 shadow-2xl`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{eyebrow}</p>
            <h2 id={titleId} className="break-words font-headline-md text-xl font-bold text-primary">{title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            <button
              type="button"
              aria-label={`Close ${title}`}
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
        </header>
        <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

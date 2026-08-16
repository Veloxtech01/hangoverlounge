import { useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'motion/react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
}) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      if (!isConfirming) onCancel();
      return;
    }
    if (e.key === 'Tab') {
      const first = cancelRef.current;
      const last = confirmRef.current;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !isConfirming && onCancel()}
        >
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="w-full max-w-sm rounded-2xl border border-[#453626] bg-[#241A15] p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[#F0E3CC]">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-[#9C8F80]">
              {message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-5">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={isConfirming}
                className="cursor-pointer text-xs font-medium uppercase tracking-[0.15em] text-[#9C8F80] transition-colors duration-200 hover:text-[#F0E3CC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className="cursor-pointer rounded-full border border-[#8C3A2B] bg-[#3A211B] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F0C9BE] transition-colors duration-200 hover:bg-[#4A2A22] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirming ? 'Working…' : confirmLabel}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

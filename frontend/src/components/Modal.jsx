import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

/** Uses the native <dialog>: focus trap, Escape to close and inert background come for free. */
export default function Modal({ open, onClose, title, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="modal__panel">
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </dialog>
  );
}

/** Confirmation dialog for destructive actions (leave / cancel / delete). */
export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Keep it', danger = false, loading = false,
  onConfirm, onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}

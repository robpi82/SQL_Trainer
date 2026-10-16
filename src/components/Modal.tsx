import { useEffect, useRef, type ReactNode } from 'react';

/** Barrierearmer Bestätigungsdialog auf Basis von <dialog>. */
export function Modal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="modal" onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      <div className="modal-body">{children}</div>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

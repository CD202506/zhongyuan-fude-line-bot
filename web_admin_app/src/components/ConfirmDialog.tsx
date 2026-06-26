type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "warning";
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "確認",
  cancelLabel = "取消",
  tone = "default",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <section className={`confirm-dialog ${tone}`}>
        <h3 id="confirm-title">{title}</h3>
        <p>{body}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="secondary-action" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={tone === "warning" ? "danger" : ""} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

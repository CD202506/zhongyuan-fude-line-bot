type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "warning";
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "確認",
  cancelLabel = "取消",
  tone = "default",
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <section className={`confirm-dialog ${tone}`}>
        <h3 id="confirm-title">{title}</h3>
        <p>{body}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="secondary-action" disabled={isConfirming} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={tone === "warning" ? "danger" : ""} disabled={isConfirming} onClick={onConfirm}>
            {isConfirming ? "處理中" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

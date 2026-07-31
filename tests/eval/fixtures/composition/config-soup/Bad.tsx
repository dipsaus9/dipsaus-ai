export function OrderConfirmDialog({
  title,
  showWarningIcon,
  showCancel,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  showWarningIcon: boolean;
  showCancel: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="dialog" aria-label={title}>
      <header>
        {showWarningIcon && <span aria-hidden="true">⚠</span>}
        <h2>{title}</h2>
      </header>
      <footer>
        {showCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </footer>
    </div>
  );
}

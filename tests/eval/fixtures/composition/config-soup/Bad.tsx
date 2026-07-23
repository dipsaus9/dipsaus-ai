// Violates comp.config-soup: boolean visibility flags (showWarningIcon,
// showCancel) configure which parts of the dialog exist — configuration over
// composition, calling for a compound API. Six props keeps srp.props-cap out
// of play; the flags alone are the trigger.
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

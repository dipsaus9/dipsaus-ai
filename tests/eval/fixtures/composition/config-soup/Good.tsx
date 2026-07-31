/**
 * Inline alert with an optional dismiss affordance.
 *
 * One behavioural boolean on a one-off component is honest API design: the
 * flag changes what the component *does* (can it be dismissed), not which
 * parts render. Configuration-over-composition (comp.config-soup) starts
 * when flags multiply to toggle regions on and off — a single affordance
 * switch on a single-purpose component is the right tool.
 */
export function InlineAlert({
  message,
  dismissible,
  onDismiss,
}: {
  message: string;
  dismissible: boolean;
  onDismiss: () => void;
}) {
  return (
    <div role="alert" className="inline-alert">
      <p>{message}</p>
      {dismissible && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}

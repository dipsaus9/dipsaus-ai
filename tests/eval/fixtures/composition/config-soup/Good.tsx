// Clean twin — a single behavioural boolean on a one-off component. One flag
// controlling one affordance is not configuration-over-composition: a
// false-positive trap for "any boolean prop is soup".
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

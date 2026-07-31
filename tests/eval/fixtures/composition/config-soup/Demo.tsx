// Demo seam — two usage shapes (full dialog, minimal dialog) so a compound
// refactor is genuinely constrained to preserve both. Confirm/cancel flows
// surface as Demo-rendered log entries.
import { useState } from "react";
import { OrderConfirmDialog } from "./Bad";

export function OrderDialogsDemo() {
  const [actions, setActions] = useState<string[]>([]);
  const log = (entry: string) => setActions((current) => [...current, entry]);

  return (
    <div>
      <OrderConfirmDialog
        title="Cancel order SO-812?"
        showWarningIcon={true}
        showCancel={true}
        confirmLabel="Yes, cancel it"
        onConfirm={() => log("cancel-order-confirmed")}
        onCancel={() => log("kept-order")}
      />
      <OrderConfirmDialog
        title="Confirm payment"
        showWarningIcon={false}
        showCancel={false}
        confirmLabel="Pay €48.50"
        onConfirm={() => log("paid")}
        onCancel={() => log("never")}
      />
      <ol aria-label="actions">
        {actions.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

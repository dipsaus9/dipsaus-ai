// Violates boundary.internal-state: a profile component reads billing's
// context/store directly instead of receiving the value via props at the
// boundary. The import goes through billing's barrel, so deep-import is not
// in play — the violation is the cross-feature state dependency itself.
import { use } from "react";
import { BillingContext } from "./billing";

export function ProfileHeader({ displayName }: { displayName: string }) {
  const billing = use(BillingContext);

  return (
    <header className="profile-header">
      <h2>{displayName}</h2>
      {billing.outstandingBalance > 0 && (
        <p role="status">
          Outstanding: {billing.currency}
          {billing.outstandingBalance.toFixed(2)}
        </p>
      )}
    </header>
  );
}

// Violates boundary.hardwired-render: the profile page renders billing's
// concrete component inline. The import uses billing's public barrel, so
// deep-import is not in play — the violation is hardwiring the child feature
// into the render tree instead of composing via slots/children.
import { BillingSummary } from "./billing";

export function ProfilePage({
  displayName,
  customerId,
}: {
  displayName: string;
  customerId: string;
}) {
  return (
    <main className="profile-page">
      <h2>{displayName}</h2>
      <BillingSummary customerId={customerId} />
    </main>
  );
}

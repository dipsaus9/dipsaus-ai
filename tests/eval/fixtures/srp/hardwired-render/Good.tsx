// Clean twin — the profile page exposes a slot; whoever composes the app
// decides what renders there. Profile knows nothing about billing.
import type { ReactNode } from "react";

export function ProfilePage({
  displayName,
  billingSlot,
}: {
  displayName: string;
  billingSlot: ReactNode;
}) {
  return (
    <main className="profile-page">
      <h2>{displayName}</h2>
      {billingSlot}
    </main>
  );
}

/**
 * Profile page shell.
 *
 * What renders in the billing area is decided by whoever composes the app —
 * the page exposes a slot instead of importing and mounting another
 * feature's component itself (boundary.hardwired-render). Profile stays
 * ignorant of billing's existence; composition happens one level up.
 */
import type { ReactNode } from "react";

export function ProfilePage({
  displayName,
  billingSlot,
}: {
  displayName: string;
  // The caller writes the JSX; this component only places it.
  billingSlot: ReactNode;
}) {
  return (
    <main className="profile-page">
      <h2>{displayName}</h2>
      {billingSlot}
    </main>
  );
}

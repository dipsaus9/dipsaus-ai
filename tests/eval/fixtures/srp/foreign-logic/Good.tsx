/**
 * Billing summary card on the profile page.
 *
 * The amount due is computed by the billing feature and arrives as a prop —
 * profile renders it, billing owns it (boundary.foreign-logic). Formatting a
 * currency value for display is presentation, not domain logic, so the
 * `toFixed` here is exactly where it belongs.
 */
export function ProfileBillingCard({
  memberSince,
  amountDue,
}: {
  memberSince: string;
  amountDue: number;
}) {
  return (
    <section className="profile-billing">
      <h3>Billing</h3>
      <p>Member since {memberSince}</p>
      <p>Amount due €{amountDue.toFixed(2)}</p>
    </section>
  );
}

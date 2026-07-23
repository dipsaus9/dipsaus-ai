// Clean twin — billing computes the amount at the boundary; the profile card
// only formats and renders what it receives. Formatting a currency value is
// presentation, not foreign domain logic: a false-positive trap.
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

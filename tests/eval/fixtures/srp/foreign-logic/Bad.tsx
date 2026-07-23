// Violates boundary.foreign-logic: a profile component computes billing-domain
// rules (VAT + loyalty discount) inline. Nothing is imported from billing, so
// only the misplaced-knowledge rule is broken.
export function ProfileBillingCard({
  memberSince,
  outstandingNet,
}: {
  memberSince: string;
  outstandingNet: number;
}) {
  const loyaltyYears = 2026 - Number(memberSince.slice(0, 4));
  const loyaltyDiscount = loyaltyYears >= 5 ? outstandingNet * 0.05 : 0;
  const vat = (outstandingNet - loyaltyDiscount) * 0.21;
  const amountDue = outstandingNet - loyaltyDiscount + vat;

  return (
    <section className="profile-billing">
      <h3>Billing</h3>
      <p>Member since {memberSince}</p>
      <p>Amount due €{amountDue.toFixed(2)}</p>
    </section>
  );
}

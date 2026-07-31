const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatMemberSince(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function formatPeriod(start: string, end: string): string {
  return `${formatMemberSince(start)} – ${formatMemberSince(end)}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function ProfileBillingCard({
  displayName,
  memberSince,
  outstandingNet,
  supportEmail,
  periodStart,
  periodEnd,
}: {
  displayName: string;
  memberSince: string;
  outstandingNet: number;
  supportEmail: string;
  periodStart: string;
  periodEnd: string;
}) {
  const loyaltyYears = 2026 - Number(memberSince.slice(0, 4));
  const loyaltyDiscount = loyaltyYears >= 5 ? outstandingNet * 0.05 : 0;
  const vat = (outstandingNet - loyaltyDiscount) * 0.21;
  const amountDue = outstandingNet - loyaltyDiscount + vat;

  return (
    <section className="profile-billing">
      <header>
        <span className="avatar" aria-hidden="true">
          {initialsOf(displayName)}
        </span>
        <h3>Billing</h3>
      </header>
      <p>Member since {formatMemberSince(memberSince)}</p>
      <p>Billing period {formatPeriod(periodStart, periodEnd)}</p>
      <p>Amount due €{amountDue.toFixed(2)}</p>
      <footer>
        <p>
          Questions? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>
      </footer>
    </section>
  );
}

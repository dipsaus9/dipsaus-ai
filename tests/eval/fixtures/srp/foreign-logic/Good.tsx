/**
 * Billing summary card on the profile page.
 *
 * The amount due is computed by the billing feature and arrives as a prop —
 * profile renders it, billing owns it (boundary.foreign-logic). Formatting
 * dates, initials and currency for display is presentation, not domain
 * logic, so those helpers belong here.
 */
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
  amountDue,
  supportEmail,
  periodStart,
  periodEnd,
}: {
  displayName: string;
  memberSince: string;
  // Computed by billing (loyalty discount + VAT) and delivered as data.
  amountDue: number;
  supportEmail: string;
  periodStart: string;
  periodEnd: string;
}) {
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

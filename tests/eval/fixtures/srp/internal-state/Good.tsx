/**
 * Profile header with an optional balance notice.
 *
 * The outstanding balance is billing's data; it crosses the feature boundary
 * as a plain prop from whatever composes the two features
 * (boundary.internal-state). This component never reads billing's store,
 * context or types — swap billing out and this header does not change.
 * Everything else here (initials, tier badge, notification copy) is
 * profile-owned presentation.
 */
const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze member",
  silver: "Silver member",
  gold: "Gold member",
};

function formatLastSeen(iso: string): string {
  const [date, time] = iso.split("T");
  return `${date} at ${(time ?? "").slice(0, 5)}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function ProfileHeader({
  displayName,
  loyaltyTier,
  unreadCount,
  lastLoginAt,
  outstandingBalance,
  currency,
}: {
  displayName: string;
  loyaltyTier: "bronze" | "silver" | "gold";
  unreadCount: number;
  lastLoginAt: string;
  // Billing's value, delivered across the boundary as data.
  outstandingBalance: number;
  currency: string;
}) {
  const tierLabel = TIER_LABELS[loyaltyTier] ?? loyaltyTier;

  return (
    <header className="profile-header">
      <span className="avatar" aria-hidden="true">
        {initialsOf(displayName)}
      </span>
      <h2>{displayName}</h2>
      <p className="tier-badge">{tierLabel}</p>
      <p className="last-seen">Last seen {formatLastSeen(lastLoginAt)}</p>
      <p className="notifications">
        {unreadCount === 0
          ? "No new notifications"
          : `${unreadCount} new notification${unreadCount === 1 ? "" : "s"}`}
      </p>
      {outstandingBalance > 0 && (
        <p role="status">
          Outstanding: {currency}
          {outstandingBalance.toFixed(2)}
        </p>
      )}
    </header>
  );
}

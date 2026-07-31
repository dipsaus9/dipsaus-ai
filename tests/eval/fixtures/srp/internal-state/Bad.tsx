import { use } from "react";
import { BillingContext } from "./billing";

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
}: {
  displayName: string;
  loyaltyTier: "bronze" | "silver" | "gold";
  unreadCount: number;
  lastLoginAt: string;
}) {
  const billing = use(BillingContext);
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
      {billing.outstandingBalance > 0 && (
        <p role="status">
          Outstanding: {billing.currency}
          {billing.outstandingBalance.toFixed(2)}
        </p>
      )}
    </header>
  );
}

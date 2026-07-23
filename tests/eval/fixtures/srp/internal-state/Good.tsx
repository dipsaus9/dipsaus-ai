// Clean twin — the outstanding balance arrives via props from whatever
// composes profile and billing; no cross-feature state dependency.
export function ProfileHeader({
  displayName,
  outstandingBalance,
  currency,
}: {
  displayName: string;
  outstandingBalance: number;
  currency: string;
}) {
  return (
    <header className="profile-header">
      <h2>{displayName}</h2>
      {outstandingBalance > 0 && (
        <p role="status">
          Outstanding: {currency}
          {outstandingBalance.toFixed(2)}
        </p>
      )}
    </header>
  );
}

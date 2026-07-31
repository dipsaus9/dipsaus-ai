/**
 * Profile header with an optional balance notice.
 *
 * The outstanding balance is billing's data; it crosses the feature boundary
 * as a plain prop from whatever composes the two features
 * (boundary.internal-state). This component never reads billing's store,
 * context or types — swap billing out and this header does not change.
 */
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

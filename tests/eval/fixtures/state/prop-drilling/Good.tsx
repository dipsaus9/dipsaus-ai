// Clean twin — same tree, but the props pass through exactly ONE silent
// intermediate (NotificationPanel), under the 2+ threshold the rule sets.
// A false-positive trap for "any pass-through is drilling".
import { useState } from "react";

function EmailToggle({
  emailOptIn,
  onEmailOptInChange,
}: {
  emailOptIn: boolean;
  onEmailOptInChange: (optIn: boolean) => void;
}) {
  return (
    <label>
      Order updates by email
      <input
        type="checkbox"
        checked={emailOptIn}
        onChange={(e) => onEmailOptInChange(e.target.checked)}
      />
    </label>
  );
}

function NotificationPanel({
  emailOptIn,
  onEmailOptInChange,
}: {
  emailOptIn: boolean;
  onEmailOptInChange: (optIn: boolean) => void;
}) {
  return (
    <div className="notification-panel">
      <h4>Notifications</h4>
      <EmailToggle emailOptIn={emailOptIn} onEmailOptInChange={onEmailOptInChange} />
    </div>
  );
}

export function AccountPage() {
  const [emailOptIn, setEmailOptIn] = useState(false);

  return (
    <main>
      <h2>Account</h2>
      <p role="status">{emailOptIn ? "Email updates on" : "Email updates off"}</p>
      <NotificationPanel emailOptIn={emailOptIn} onEmailOptInChange={setEmailOptIn} />
    </main>
  );
}

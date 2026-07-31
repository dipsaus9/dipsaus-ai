/**
 * Account page with notification preferences.
 *
 * The email opt-in passes through exactly one intermediate
 * (NotificationPanel) on its way to the toggle. The drilling rule
 * (state.prop-drilling) draws the line at 2+ silent intermediates — one
 * pass-through keeps the data flow explicit and is cheaper than context or
 * restructuring. If the tree deepens, the fix is composition: pass the
 * toggle down as children.
 */
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

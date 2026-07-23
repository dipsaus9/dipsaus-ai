// Violates state.prop-drilling: emailOptIn and onEmailOptInChange are
// threaded through TWO intermediate components (SettingsSection,
// NotificationPanel) that never use them — only EmailToggle does.
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

function SettingsSection({
  emailOptIn,
  onEmailOptInChange,
}: {
  emailOptIn: boolean;
  onEmailOptInChange: (optIn: boolean) => void;
}) {
  return (
    <section className="settings">
      <h3>Settings</h3>
      <NotificationPanel
        emailOptIn={emailOptIn}
        onEmailOptInChange={onEmailOptInChange}
      />
    </section>
  );
}

export function AccountPage() {
  const [emailOptIn, setEmailOptIn] = useState(false);

  return (
    <main>
      <h2>Account</h2>
      <p role="status">{emailOptIn ? "Email updates on" : "Email updates off"}</p>
      <SettingsSection emailOptIn={emailOptIn} onEmailOptInChange={setEmailOptIn} />
    </main>
  );
}

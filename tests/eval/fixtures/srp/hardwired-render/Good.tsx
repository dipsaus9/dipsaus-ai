/**
 * Profile page shell.
 *
 * What renders in the billing area is decided by whoever composes the app —
 * the page exposes a slot instead of importing and mounting another
 * feature's component itself (boundary.hardwired-render). Profile stays
 * ignorant of billing's existence; composition happens one level up.
 */
import type { ReactNode } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Presentation helpers owned by profile — formatting its own data is not a
// boundary concern.
function formatJoinDate(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

interface Contact {
  kind: "email" | "phone";
  value: string;
}

export function ProfilePage({
  displayName,
  customerId,
  joinedAt,
  contacts,
  billingSlot,
}: {
  displayName: string;
  customerId: string;
  joinedAt: string;
  contacts: Contact[];
  // The caller writes the JSX; this component only places it.
  billingSlot: ReactNode;
}) {
  return (
    <main className="profile-page">
      <header className="profile-masthead">
        <span className="avatar" aria-hidden="true">
          {initialsOf(displayName)}
        </span>
        <h2>{displayName}</h2>
        <p>Member since {formatJoinDate(joinedAt)}</p>
      </header>
      <section className="profile-contacts">
        <h3>Contact details</h3>
        <ul>
          {contacts.map((contact) => (
            <li key={contact.value}>
              <span className="contact-kind">{contact.kind}</span> {contact.value}
            </li>
          ))}
        </ul>
      </section>
      {billingSlot}
      <footer className="profile-footer">
        <p>Customer reference {customerId}</p>
      </footer>
    </main>
  );
}

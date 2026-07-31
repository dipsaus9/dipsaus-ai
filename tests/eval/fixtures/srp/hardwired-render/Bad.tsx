import { BillingSummary } from "./billing";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
}: {
  displayName: string;
  customerId: string;
  joinedAt: string;
  contacts: Contact[];
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
      <BillingSummary customerId={customerId} />
      <footer className="profile-footer">
        <p>Customer reference {customerId}</p>
      </footer>
    </main>
  );
}

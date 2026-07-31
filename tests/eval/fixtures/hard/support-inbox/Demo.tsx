import { useState } from "react";
import { InboxShell } from "./InboxShell";
import type { Ticket } from "./tickets";

const demoTickets: Ticket[] = [
  { id: "T-1", subject: "Broken desk leg", status: "open" },
  { id: "T-2", subject: "Late delivery", status: "pending" },
  { id: "T-3", subject: "Invoice copy", status: "closed" },
];

export function SupportInboxDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <InboxShell tickets={demoTickets} onSelectTicket={setSelectedId} />
      <p role="status">{selectedId === null ? "Nothing selected" : `Selected ${selectedId}`}</p>
    </div>
  );
}

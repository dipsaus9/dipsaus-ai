import { useState } from "react";
import { InboxLayout } from "./InboxLayout";
import { InboxPanel } from "./InboxPanel";
import { filterTickets, type Ticket } from "./tickets";

export function InboxShell({
  tickets,
  onSelectTicket,
}: {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const visible = filterTickets(tickets, filter);

  return (
    <InboxLayout filter={filter} onFilterChange={setFilter}>
      <InboxPanel
        tickets={visible}
        title="Support inbox"
        showSummary={true}
        showBulkActions={true}
        compact={false}
        emptyLabel="No tickets match"
        onSelectTicket={onSelectTicket}
      />
    </InboxLayout>
  );
}

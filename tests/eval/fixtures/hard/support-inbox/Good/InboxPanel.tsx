/**
 * Support inbox panel as a compound component.
 *
 * The old flag props (showSummary, showBulkActions, …) became parts the
 * caller composes in — an omitted part simply doesn't render
 * (comp.config-soup, comp.slots-over-config). Tickets and the select
 * handler flow to the parts through context behind the compound API, so
 * the public surface stays at four props (srp.props-cap).
 */
import { createContext, use, type ReactNode } from "react";
import { countByStatus, type Ticket } from "../tickets";

interface InboxContextValue {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}

const InboxContext = createContext<InboxContextValue>({
  tickets: [],
  onSelectTicket: () => {},
});

export function InboxPanel({
  tickets,
  onSelectTicket,
  title,
  children,
}: {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="inbox">
      <h3>{title}</h3>
      <InboxContext.Provider value={{ tickets, onSelectTicket }}>
        {children}
      </InboxContext.Provider>
    </section>
  );
}

InboxPanel.Summary = function Summary() {
  const { tickets } = use(InboxContext);
  return (
    <p className="inbox-summary">
      {countByStatus(tickets, "open")} open · {countByStatus(tickets, "pending")} pending
    </p>
  );
};

InboxPanel.BulkActions = function BulkActions() {
  return (
    <div className="bulk-actions">
      <button type="button">Close all</button>
      <button type="button">Mark read</button>
    </div>
  );
};

InboxPanel.List = function List({ emptyLabel }: { emptyLabel: string }) {
  const { tickets, onSelectTicket } = use(InboxContext);
  if (tickets.length === 0) {
    return <p className="inbox-empty">{emptyLabel}</p>;
  }
  return (
    <ul>
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <button type="button" onClick={() => onSelectTicket(ticket.id)}>
            {ticket.subject} ({ticket.status})
          </button>
        </li>
      ))}
    </ul>
  );
};

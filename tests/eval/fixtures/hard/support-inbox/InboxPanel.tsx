import { countByStatus, type Ticket } from "./tickets";

export function InboxPanel({
  tickets,
  title,
  showSummary,
  showBulkActions,
  compact,
  emptyLabel,
  onSelectTicket,
}: {
  tickets: Ticket[];
  title: string;
  showSummary: boolean;
  showBulkActions: boolean;
  compact: boolean;
  emptyLabel: string;
  onSelectTicket: (id: string) => void;
}) {
  return (
    <section className={compact ? "inbox inbox--compact" : "inbox"}>
      <h3>{title}</h3>
      {showSummary && (
        <p className="inbox-summary">
          {countByStatus(tickets, "open")} open · {countByStatus(tickets, "pending")} pending
        </p>
      )}
      {showBulkActions && (
        <div className="bulk-actions">
          <button type="button">Close all</button>
          <button type="button">Mark read</button>
        </div>
      )}
      {tickets.length === 0 ? (
        <p className="inbox-empty">{emptyLabel}</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button type="button" onClick={() => onSelectTicket(ticket.id)}>
                {ticket.subject} ({ticket.status})
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

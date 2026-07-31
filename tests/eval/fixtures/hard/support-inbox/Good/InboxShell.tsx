/**
 * Inbox shell: owns the filter and composes the pieces directly.
 *
 * The filter input is rendered by the state owner itself and placed into
 * the layout as a slot — no silent intermediates thread filter props
 * through the tree (state.prop-drilling). The panel's optional regions are
 * composed in as compound parts rather than toggled by flags.
 */
import { useState, type ReactNode } from "react";
import { InboxPanel } from "./InboxPanel";
import { filterTickets, type Ticket } from "../tickets";

function InboxLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="inbox-layout">
      <aside className="inbox-sidebar">{sidebar}</aside>
      <main className="inbox-main">{children}</main>
    </div>
  );
}

function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <input
      aria-label="Filter tickets"
      placeholder="Filter tickets"
      value={filter}
      onChange={(e) => onFilterChange(e.target.value)}
    />
  );
}

export function InboxShell({
  tickets,
  onSelectTicket,
}: {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  // Derived during render; the owner renders the consumer of its own state.
  const visible = filterTickets(tickets, filter);

  return (
    <InboxLayout
      sidebar={
        <div className="sidebar-section">
          <h4>Search</h4>
          <FilterBar filter={filter} onFilterChange={setFilter} />
        </div>
      }
    >
      <InboxPanel tickets={visible} onSelectTicket={onSelectTicket} title="Support inbox">
        <InboxPanel.Summary />
        <InboxPanel.BulkActions />
        <InboxPanel.List emptyLabel="No tickets match" />
      </InboxPanel>
    </InboxLayout>
  );
}

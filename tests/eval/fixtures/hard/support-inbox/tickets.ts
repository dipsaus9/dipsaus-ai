export interface Ticket {
  id: string;
  subject: string;
  status: "open" | "pending" | "closed";
}

export function filterTickets(tickets: Ticket[], query: string): Ticket[] {
  const needle = query.toLowerCase();
  return tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(needle),
  );
}

export function countByStatus(tickets: Ticket[], status: Ticket["status"]): number {
  return tickets.filter((ticket) => ticket.status === status).length;
}

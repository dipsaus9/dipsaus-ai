import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InboxShell } from "./Good/InboxShell";
import type { Ticket } from "./tickets";

const tickets: Ticket[] = [
  { id: "T-1", subject: "Broken desk leg", status: "open" },
  { id: "T-2", subject: "Late delivery", status: "pending" },
  { id: "T-3", subject: "Invoice copy", status: "closed" },
];

describe("hard/support-inbox good twin", () => {
  it("Good renders, filters and selects identically via composition", () => {
    const onSelect = vi.fn();
    render(<InboxShell tickets={tickets} onSelectTicket={onSelect} />);
    expect(screen.getByText("1 open · 1 pending")).toBeDefined();
    expect(screen.getByText("Close all")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Filter tickets"), {
      target: { value: "delivery" },
    });
    expect(screen.queryByText("Broken desk leg (open)")).toBeNull();
    fireEvent.click(screen.getByText("Late delivery (pending)"));
    expect(onSelect).toHaveBeenCalledWith("T-2");
    fireEvent.change(screen.getByLabelText("Filter tickets"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No tickets match")).toBeDefined();
  });
});

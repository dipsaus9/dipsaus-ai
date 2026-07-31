import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupportInboxDemo } from "./Demo";

describe("hard/support-inbox", () => {
  it("Demo lists tickets with the summary and bulk actions", () => {
    render(<SupportInboxDemo />);
    expect(screen.getByText("Support inbox")).toBeDefined();
    expect(screen.getByText("1 open · 1 pending")).toBeDefined();
    expect(screen.getByText("Close all")).toBeDefined();
    expect(screen.getByText("Broken desk leg (open)")).toBeDefined();
  });

  it("Demo filters tickets and reports the selection", () => {
    render(<SupportInboxDemo />);
    fireEvent.change(screen.getByLabelText("Filter tickets"), {
      target: { value: "delivery" },
    });
    expect(screen.queryByText("Broken desk leg (open)")).toBeNull();
    fireEvent.click(screen.getByText("Late delivery (pending)"));
    expect(screen.getByRole("status").textContent).toBe("Selected T-2");
  });

  it("Demo shows the empty label when nothing matches", () => {
    render(<SupportInboxDemo />);
    fireEvent.change(screen.getByLabelText("Filter tickets"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No tickets match")).toBeDefined();
  });
});

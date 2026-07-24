import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountDashboardDemo } from "./Demo";

// Asserted through the Demo seam only — the refactor may split the dashboard
// into any shape as long as Demo keeps rendering this behavior.
describe("srp/god-component", () => {
  it("computes stats, filters orders, switches tabs and reports analytics", () => {
    render(<AccountDashboardDemo />);
    // 6 loyalty years × 12 + 2 orders × 3 = 78; lifetime 150 × 1.21 = 181.50
    expect(screen.getByText("Loyalty score 78")).toBeDefined();
    expect(screen.getByText("Lifetime value €181.50")).toBeDefined();
    expect(screen.getByText("1 open orders")).toBeDefined();

    fireEvent.click(screen.getByText("Show filters"));
    fireEvent.change(screen.getByLabelText("Search orders"), {
      target: { value: "so-2" },
    });
    expect(screen.queryByText("SO-1")).toBeNull();
    expect(screen.getByText("SO-2")).toBeDefined();

    fireEvent.click(screen.getByText("Notifications"));
    expect(screen.getByText("Your order SO-1 is being picked")).toBeDefined();

    const analytics = within(screen.getByLabelText("analytics"))
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(analytics).toContain("dashboard-tab:orders");
    expect(analytics).toContain("dashboard-tab:notifications");
  });
});

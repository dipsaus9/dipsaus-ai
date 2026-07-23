import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomerDashboard } from "./Bad";

describe("state/customer-dashboard", () => {
  it("loads orders, derives lifetime value, and reaches support from the leaf", async () => {
    const onContactSupport = vi.fn();
    const api = {
      getOrders: () =>
        Promise.resolve([
          { id: "SO-1", total: 120 },
          { id: "SO-2", total: 80.5 },
        ]),
    };
    render(
      <CustomerDashboard
        customerId="cus_42"
        api={api}
        onContactSupport={onContactSupport}
      />,
    );
    expect(screen.getByText("Loading dashboard…")).toBeDefined();
    expect(await screen.findByText("SO-1 — €120.00")).toBeDefined();
    expect(screen.getByText("Lifetime value €200.50")).toBeDefined();
    fireEvent.click(screen.getByText("Contact support"));
    expect(onContactSupport).toHaveBeenCalledWith("cus_42");
  });
});

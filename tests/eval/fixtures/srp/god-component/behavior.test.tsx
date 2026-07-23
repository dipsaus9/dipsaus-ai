import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountDashboard } from "./Bad";

const orders = [
  { id: "SO-1", placedAt: "2026-05-01", total: 100, status: "open" as const },
  { id: "SO-2", placedAt: "2026-06-12", total: 50, status: "delivered" as const },
];
const notifications = [{ id: "n-1", message: "Your order SO-1 is being picked" }];

describe("srp/god-component", () => {
  it("computes stats, filters orders and switches tabs", () => {
    const onAnalyticsEvent = vi.fn();
    render(
      <AccountDashboard
        displayName="Dennis"
        memberSince="2020-02-02"
        orders={orders}
        notifications={notifications}
        taxRate={0.21}
        refreshIntervalMs={60000}
        onAnalyticsEvent={onAnalyticsEvent}
      />,
    );
    // 6 loyalty years × 12 + 2 orders × 3 = 78; lifetime 150 × 1.21 = 181.50
    expect(screen.getByText("Loyalty score 78")).toBeDefined();
    expect(screen.getByText("Lifetime value €181.50")).toBeDefined();
    expect(screen.getByText("1 open orders")).toBeDefined();
    expect(onAnalyticsEvent).toHaveBeenCalledWith("dashboard-tab:orders");

    fireEvent.click(screen.getByText("Show filters"));
    fireEvent.change(screen.getByLabelText("Search orders"), {
      target: { value: "so-2" },
    });
    expect(screen.queryByText("SO-1")).toBeNull();
    expect(screen.getByText("SO-2")).toBeDefined();

    fireEvent.click(screen.getByText("Notifications"));
    expect(screen.getByText("Your order SO-1 is being picked")).toBeDefined();
    expect(onAnalyticsEvent).toHaveBeenCalledWith("dashboard-tab:notifications");
  });
});

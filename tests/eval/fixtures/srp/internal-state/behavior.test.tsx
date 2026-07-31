import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeader as BadHeader } from "./Bad";
import { BillingProvider } from "./billing";

describe("srp/internal-state", () => {
  it("Bad renders profile chrome and billing's balance from context", () => {
    render(
      <BillingProvider state={{ outstandingBalance: 42.5, currency: "€" }}>
        <BadHeader displayName="Dennis Spierenburg" loyaltyTier="gold" unreadCount={2} lastLoginAt="2026-07-30T09:15:00Z" />
      </BillingProvider>,
    );
    expect(screen.getByText("DS")).toBeDefined();
    expect(screen.getByText("Gold member")).toBeDefined();
    expect(screen.getByText("Last seen 2026-07-30 at 09:15")).toBeDefined();
    expect(screen.getByText("2 new notifications")).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });

  it("Bad singularises one notification", () => {
    render(
      <BillingProvider state={{ outstandingBalance: 0, currency: "€" }}>
        <BadHeader displayName="Dennis" loyaltyTier="bronze" unreadCount={1} lastLoginAt="2026-07-30T09:15:00Z" />
      </BillingProvider>,
    );
    expect(screen.getByText("1 new notification")).toBeDefined();
  });
});

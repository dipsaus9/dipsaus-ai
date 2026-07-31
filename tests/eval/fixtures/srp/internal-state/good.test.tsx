import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeader as GoodHeader } from "./Good";

describe("srp/internal-state good twin", () => {
  it("Good renders identically with the balance passed as props", () => {
    render(
      <GoodHeader
        displayName="Dennis Spierenburg"
        loyaltyTier="gold"
        unreadCount={2}
        lastLoginAt="2026-07-30T09:15:00Z"
        outstandingBalance={42.5}
        currency="€"
      />,
    );
    expect(screen.getByText("Gold member")).toBeDefined();
    expect(screen.getByText("Last seen 2026-07-30 at 09:15")).toBeDefined();
    expect(screen.getByText("2 new notifications")).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });
});

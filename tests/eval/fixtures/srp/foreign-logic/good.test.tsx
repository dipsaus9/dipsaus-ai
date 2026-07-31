import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileBillingCard as GoodCard } from "./Good";

describe("srp/foreign-logic good twin", () => {
  it("Good renders the same card with the amount computed upstream", () => {
    render(
      <GoodCard
        displayName="Dennis Spierenburg"
        memberSince="2019-04-02"
        amountDue={114.95}
        supportEmail="support@example.com"
        periodStart="2026-06-01"
        periodEnd="2026-07-01"
      />,
    );
    expect(screen.getByText("Member since April 2019")).toBeDefined();
    expect(screen.getByText("Amount due €114.95")).toBeDefined();
    expect(screen.getByText("Billing period June 2026 – July 2026")).toBeDefined();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileBillingCard as BadCard } from "./Bad";

describe("srp/foreign-logic", () => {
  it("Bad computes amount due (5y loyalty discount + 21% VAT) itself", () => {
    // net 100 → 7 loyalty years → −5.00 → VAT 19.95 → due 114.95
    render(
      <BadCard
        displayName="Dennis Spierenburg"
        memberSince="2019-04-02"
        outstandingNet={100}
        supportEmail="support@example.com"
        periodStart="2026-06-01"
        periodEnd="2026-07-01"
      />,
    );
    expect(screen.getByText("DS")).toBeDefined();
    expect(screen.getByText("Member since April 2019")).toBeDefined();
    expect(screen.getByText("Amount due €114.95")).toBeDefined();
    expect(screen.getByText("Billing period June 2026 – July 2026")).toBeDefined();
    expect(screen.getByText("support@example.com")).toBeDefined();
  });
});

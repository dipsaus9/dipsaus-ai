import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfilePage as GoodPage } from "./Good";

const contacts = [{ kind: "email" as const, value: "dennis@example.com" }];

describe("srp/hardwired-render good twin", () => {
  it("Good renders identically with billing composed in via the slot", () => {
    render(
      <GoodPage
        displayName="Dennis Spierenburg"
        customerId="cus_881"
        joinedAt="2021-03-14"
        contacts={contacts}
        billingSlot={<p>Billing summary for cus_881</p>}
      />,
    );
    expect(screen.getByText("DS")).toBeDefined();
    expect(screen.getByText("Member since March 2021")).toBeDefined();
    expect(screen.getByText("Billing summary for cus_881")).toBeDefined();
  });
});

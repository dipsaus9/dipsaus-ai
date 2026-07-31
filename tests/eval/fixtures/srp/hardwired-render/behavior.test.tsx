import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfilePage as BadPage } from "./Bad";

const contacts = [
  { kind: "email" as const, value: "dennis@example.com" },
  { kind: "phone" as const, value: "+31 6 1234 5678" },
];

describe("srp/hardwired-render", () => {
  it("Bad renders the masthead, contacts and billing summary", () => {
    render(
      <BadPage
        displayName="Dennis Spierenburg"
        customerId="cus_881"
        joinedAt="2021-03-14"
        contacts={contacts}
      />,
    );
    expect(screen.getByText("DS")).toBeDefined();
    expect(screen.getByText("Member since March 2021")).toBeDefined();
    expect(screen.getByText("dennis@example.com")).toBeDefined();
    expect(screen.getByText("Billing summary for cus_881")).toBeDefined();
    expect(screen.getByText("Customer reference cus_881")).toBeDefined();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeader as BadHeader } from "./Bad";
import { BillingProvider } from "./billing";

describe("srp/internal-state", () => {
  it("Bad reads the outstanding balance from billing's context", () => {
    render(
      <BillingProvider state={{ outstandingBalance: 42.5, currency: "€" }}>
        <BadHeader displayName="Dennis" />
      </BillingProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });
});

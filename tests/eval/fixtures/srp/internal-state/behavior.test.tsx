import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeader as BadHeader } from "./Bad";
import { BillingProvider } from "./billing";
import { ProfileHeader as GoodHeader } from "./Good";

describe("srp/internal-state", () => {
  it("Bad reads the outstanding balance from billing's context", () => {
    render(
      <BillingProvider state={{ outstandingBalance: 42.5, currency: "€" }}>
        <BadHeader displayName="Dennis" />
      </BillingProvider>,
    );
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });

  it("Good receives the outstanding balance via props", () => {
    render(
      <GoodHeader displayName="Dennis" outstandingBalance={42.5} currency="€" />,
    );
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });
});

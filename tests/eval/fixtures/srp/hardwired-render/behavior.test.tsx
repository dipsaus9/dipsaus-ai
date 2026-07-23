import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingSummary } from "./billing";
import { ProfilePage as BadPage } from "./Bad";
import { ProfilePage as GoodPage } from "./Good";

describe("srp/hardwired-render", () => {
  it("Bad renders billing's summary hardwired into the page", () => {
    render(<BadPage displayName="Dennis" customerId="cus_881" />);
    expect(screen.getByText("Billing summary for cus_881")).toBeDefined();
  });

  it("Good renders whatever the composer puts in the slot", () => {
    render(
      <GoodPage
        displayName="Dennis"
        billingSlot={<BillingSummary customerId="cus_881" />}
      />,
    );
    expect(screen.getByText("Billing summary for cus_881")).toBeDefined();
  });
});

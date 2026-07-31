import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingSummary } from "./billing";
import { ProfilePage as GoodPage } from "./Good";

describe("srp/hardwired-render good twin", () => {
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

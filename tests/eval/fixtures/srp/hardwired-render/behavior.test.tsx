import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingSummary } from "./billing";
import { ProfilePage as BadPage } from "./Bad";

describe("srp/hardwired-render", () => {
  it("Bad renders billing's summary hardwired into the page", () => {
    render(<BadPage displayName="Dennis" customerId="cus_881" />);
    expect(screen.getByText("Billing summary for cus_881")).toBeDefined();
  });
});

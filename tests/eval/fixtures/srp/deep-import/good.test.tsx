import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTotalFooter as GoodFooter } from "./Good";

const lines = [
  { sku: "sku-1", name: "Desk lamp", price: 60 },
  { sku: "sku-2", name: "Cable tray", price: 40 },
];

describe("srp/deep-import good twin", () => {
  it("Good computes identical totals via billing's public barrel", () => {
    render(<GoodFooter lines={lines} region="eu" shippingCost={6.95} deliveryEstimate="Tue 4 Aug" />);
    expect(screen.getByText("Subtotal €100.00")).toBeDefined();
    expect(screen.getByText("Tax €21.00")).toBeDefined();
    expect(screen.getByText("Due €121.00")).toBeDefined();
    expect(screen.getByText(/Estimated delivery Tue 4 Aug/)).toBeDefined();
  });
});

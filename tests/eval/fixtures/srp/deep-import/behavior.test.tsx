import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTotalFooter as BadFooter } from "./Bad";

const lines = [
  { sku: "sku-1", name: "Desk lamp", price: 60 },
  { sku: "sku-2", name: "Cable tray", price: 40 },
];

describe("srp/deep-import", () => {
  it("Bad lists lines and shows EU tax with free shipping over threshold", () => {
    render(<BadFooter lines={lines} region="eu" shippingCost={6.95} deliveryEstimate="Tue 4 Aug" />);
    expect(screen.getByText("Desk lamp — €60.00")).toBeDefined();
    expect(screen.getByText("Subtotal €100.00")).toBeDefined();
    expect(screen.getByText("Tax €21.00")).toBeDefined();
    expect(screen.getByText(/Shipping free/)).toBeDefined();
    expect(screen.getByText("Due €121.00")).toBeDefined();
    expect(screen.getByText(/Estimated delivery Tue 4 Aug/)).toBeDefined();
  });

  it("Bad charges shipping under the threshold and hints the cutoff", () => {
    render(
      <BadFooter lines={[lines[1]!]} region="eu" shippingCost={6.95} deliveryEstimate="Tue 4 Aug" />,
    );
    expect(screen.getByText(/Shipping €6.95/)).toBeDefined();
    expect(screen.getByText(/free over €50.00/)).toBeDefined();
  });
});

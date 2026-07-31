import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutReview } from "./Good/CheckoutReview";

const lines = [
  { sku: "sku-1", name: "Standing desk", unitPrice: 400, quantity: 1, stockLevel: 8 },
  { sku: "sku-2", name: "Desk lamp", unitPrice: 50, quantity: 2, stockLevel: 3 },
];

describe("hard/checkout-review good twin", () => {
  it("Good renders identically with the quote delivered as data", () => {
    render(<CheckoutReview lines={lines} quote={{ carrier: "PostNL", cost: 6.95 }} />);
    expect(screen.getByText("1× Standing desk")).toBeDefined();
    expect(screen.getByText("Only 3 left")).toBeDefined();
    expect(screen.getByText("Subtotal €500.00")).toBeDefined();
    expect(screen.getByText("Total €506.95")).toBeDefined();
  });

  it("Good shows the pending state while the loader is in flight", () => {
    render(<CheckoutReview lines={lines} quote={null} />);
    expect(screen.getByText("Fetching shipping…")).toBeDefined();
  });
});

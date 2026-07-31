import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckoutReviewDemo } from "./Demo";

describe("hard/checkout-review", () => {
  it("Demo lists the cart with stock labels and totals once the quote lands", async () => {
    render(<CheckoutReviewDemo />);
    expect(screen.getByText("1× Standing desk")).toBeDefined();
    expect(screen.getByText("2× Desk lamp")).toBeDefined();
    expect(screen.getByText("Only 3 left")).toBeDefined();
    expect(screen.getByText("Subtotal €500.00")).toBeDefined();
    expect(await screen.findByText("Shipping via PostNL €6.95")).toBeDefined();
    expect(await screen.findByText("Total €506.95")).toBeDefined();
  });
});

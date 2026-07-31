import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartTotals as GoodTotals } from "./Good";

const lines = [
  { sku: "sku-1", name: "Standing desk", unitPrice: 400, quantity: 1 },
  { sku: "sku-2", name: "Monitor arm", unitPrice: 100, quantity: 1 },
];

// subtotal 500 \u2192 10% discount 50 \u2192 tax (450 \u00d7 0.21) 94.50 \u2192 total 544.50

describe("srp/mixed-concerns good twin", () => {
  it("Good computes identical totals via the hook", () => {
    const onTotalsViewed = vi.fn();
    render(
      <GoodTotals lines={lines} taxRate={0.21} onTotalsViewed={onTotalsViewed} />,
    );
    expect(screen.getByText("Total: \u20ac544.50")).toBeDefined();
    expect(onTotalsViewed).toHaveBeenCalledWith(500);
  });
});

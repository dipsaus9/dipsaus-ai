import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartTotals as BadTotals } from "./Bad";
import { CartTotals as GoodTotals } from "./Good";

const lines = [
  { sku: "sku-1", name: "Standing desk", unitPrice: 400, quantity: 1 },
  { sku: "sku-2", name: "Monitor arm", unitPrice: 100, quantity: 1 },
];

// subtotal 500 → 10% discount 50 → tax (450 × 0.21) 94.50 → total 544.50

describe("srp/mixed-concerns", () => {
  it("Bad applies tiered discount and tax, reports the view", () => {
    const onTotalsViewed = vi.fn();
    render(
      <BadTotals lines={lines} taxRate={0.21} onTotalsViewed={onTotalsViewed} />,
    );
    expect(screen.getByText("Total: €544.50")).toBeDefined();
    expect(onTotalsViewed).toHaveBeenCalledWith(500);
    fireEvent.click(screen.getByText("Show breakdown"));
    expect(screen.getByText("−€50.00")).toBeDefined();
  });

  it("Good computes identical totals via the hook", () => {
    const onTotalsViewed = vi.fn();
    render(
      <GoodTotals lines={lines} taxRate={0.21} onTotalsViewed={onTotalsViewed} />,
    );
    expect(screen.getByText("Total: €544.50")).toBeDefined();
    expect(onTotalsViewed).toHaveBeenCalledWith(500);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutForm as BadForm } from "./Bad";
import { CheckoutForm as GoodForm } from "./Good";

const items = [
  { id: "sku-1", name: "Desk lamp", unitPrice: 49.95, quantity: 2 },
  { id: "sku-2", name: "Oak shelf", unitPrice: 120, quantity: 1 },
];

describe("srp/hooks-cap", () => {
  it("Bad computes the total and submits the entered details", () => {
    const onSubmit = vi.fn();
    render(<BadForm items={items} onSubmit={onSubmit} />);
    expect(screen.getByText("Total: €219.90")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "dennis@example.com" },
    });
    fireEvent.click(screen.getByText("Place order"));
    expect(onSubmit).toHaveBeenCalledWith("dennis@example.com", "", "standard");
  });

  it("Good computes the total and submits the entered details", () => {
    const onSubmit = vi.fn();
    render(<GoodForm items={items} onSubmit={onSubmit} />);
    expect(screen.getByText("Total: €219.90")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "dennis@example.com" },
    });
    fireEvent.click(screen.getByText("Place order"));
    expect(onSubmit).toHaveBeenCalledWith("dennis@example.com", "", "standard");
  });
});

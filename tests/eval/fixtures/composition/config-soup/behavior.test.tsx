import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderDialogsDemo } from "./Demo";
import { InlineAlert } from "./Good";

describe("composition/config-soup", () => {
  it("Demo renders both dialog shapes and surfaces the flows", () => {
    render(<OrderDialogsDemo />);
    expect(screen.getByText("Cancel order SO-812?")).toBeDefined();
    expect(screen.getByText("Confirm payment")).toBeDefined();
    // only the full dialog offers cancel and the warning icon
    expect(screen.getAllByText("Cancel")).toHaveLength(1);
    expect(screen.getAllByText("⚠")).toHaveLength(1);

    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes, cancel it"));
    fireEvent.click(screen.getByText("Pay €48.50"));
    const actions = within(screen.getByLabelText("actions"))
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(actions).toEqual(["kept-order", "cancel-order-confirmed", "paid"]);
  });

  it("Good renders the alert and dismisses", () => {
    const onDismiss = vi.fn();
    render(
      <InlineAlert message="Coupon applied" dismissible={true} onDismiss={onDismiss} />,
    );
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

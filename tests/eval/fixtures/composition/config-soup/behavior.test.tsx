import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderConfirmDialog } from "./Bad";
import { InlineAlert } from "./Good";

describe("composition/config-soup", () => {
  it("Bad shows the cancel button and icon when the flags are on", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <OrderConfirmDialog
        title="Cancel order SO-812?"
        showWarningIcon={true}
        showCancel={true}
        confirmLabel="Yes, cancel it"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText("Yes, cancel it"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("Bad hides the optional parts when the flags are off", () => {
    render(
      <OrderConfirmDialog
        title="Confirm payment"
        showWarningIcon={false}
        showCancel={false}
        confirmLabel="Pay €48.50"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByText("Cancel")).toBeNull();
    expect(screen.queryByText("⚠")).toBeNull();
    expect(screen.getByText("Pay €48.50")).toBeDefined();
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
